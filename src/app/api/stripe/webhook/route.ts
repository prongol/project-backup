import { NextRequest, NextResponse } from 'next/server';
import { stripe, verifyWebhookSignature } from '@/lib/stripe';
import { supabaseAdmin as supabase } from '@/lib/supabase/serverClient';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (metadata.type === 'escrow_deposit') {
    // Update escrow account
    await supabase
      .from('escrow_accounts')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'active',
      })
      .eq('contract_id', metadata.contractId);

    // Create transaction record
    await supabase.from('transactions').insert({
      contract_id: metadata.contractId,
      from_user_id: metadata.clientId,
      amount: paymentIntent.amount / 100,
      type: 'deposit',
      status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      description: 'Escrow deposit',
    });

    // Notify freelancer
    const { data: contract } = await supabase
      .from('contracts')
      .select('freelancer_id')
      .eq('id', metadata.contractId)
      .single();

    if (contract) {
      await supabase.rpc('create_notification', {
        p_user_id: contract.freelancer_id,
        p_type: 'payment_received',
        p_title: 'Payment Secured! 💰',
        p_message: 'The client has deposited funds into escrow.',
        p_link: `/contracts/${metadata.contractId}`,
      });
    }
  }

  if (metadata.type === 'milestone_payment') {
    // Update milestone
    await supabase
      .from('milestones')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', metadata.milestoneId);

    // Create transaction
    await supabase.from('transactions').insert({
      milestone_id: metadata.milestoneId,
      contract_id: metadata.contractId,
      amount: paymentIntent.amount / 100,
      type: 'release',
      status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      description: 'Milestone payment',
    });
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  // Update transaction status
  await supabase
    .from('transactions')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Notify user
  if (metadata.clientId) {
    await supabase.rpc('create_notification', {
      p_user_id: metadata.clientId,
      p_type: 'payment_failed',
      p_title: 'Payment Failed',
      p_message: 'Your payment could not be processed. Please try again.',
      p_link: `/contracts/${metadata.contractId}`,
    });
  }
}

// Handle Connect account updates
async function handleAccountUpdated(account: Stripe.Account) {
  const freelancerId = account.metadata?.freelancerId;

  if (freelancerId) {
    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    // Update freelancer profile
    await supabase
      .from('freelancers')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: chargesEnabled && payoutsEnabled ? 'active' : 'pending',
      })
      .eq('id', freelancerId);

    // Notify if account is fully activated
    if (chargesEnabled && payoutsEnabled) {
      const { data: freelancer } = await supabase
        .from('freelancers')
        .select('profile_id')
        .eq('id', freelancerId)
        .single();

      if (freelancer) {
        await supabase.rpc('create_notification', {
          p_user_id: freelancer.profile_id,
          p_type: 'account_verified',
          p_title: 'Account Verified! ✅',
          p_message: 'Your payment account is now active. You can receive payments.',
          p_link: '/settings/payments',
        });
      }
    }
  }
}

// Handle transfer creation
async function handleTransferCreated(transfer: Stripe.Transfer) {
  const milestoneId = transfer.metadata?.milestoneId;

  if (milestoneId) {
    // Update milestone as paid
    await supabase
      .from('milestones')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', milestoneId);

    // Update transaction with transfer details
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        metadata: { stripe_transfer_id: transfer.id },
      })
      .eq('milestone_id', milestoneId)
      .eq('type', 'release');
  }
}

// Handle refund
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  // Create refund transaction
  const { data: originalTransaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (originalTransaction) {
    await supabase.from('transactions').insert({
      contract_id: originalTransaction.contract_id,
      from_user_id: originalTransaction.to_user_id,
      to_user_id: originalTransaction.from_user_id,
      amount: charge.amount_refunded / 100,
      type: 'refund',
      status: 'completed',
      stripe_charge_id: charge.id,
      description: 'Payment refunded',
    });

    // Notify user
    await supabase.rpc('create_notification', {
      p_user_id: originalTransaction.from_user_id,
      p_type: 'payment_refunded',
      p_title: 'Payment Refunded',
      p_message: `You've received a refund of $${(charge.amount_refunded / 100).toFixed(2)}`,
      p_link: `/transactions`,
    });
  }
}
