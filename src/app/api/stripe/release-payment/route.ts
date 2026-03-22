import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// POST /api/stripe/release-payment - Release payment from escrow to freelancer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID required' }, { status: 400 });
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_id (
          id,
          stripe_account_id,
          profile_id
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if payment is held in escrow
    if (contract.payment_status !== 'held' && contract.payment_status !== 'approved') {
      return NextResponse.json(
        { error: 'Payment is not in escrow status' },
        { status: 400 }
      );
    }

    if (!contract.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found' },
        { status: 400 }
      );
    }

    // Retrieve the PI first to know its type and fee breakdown
    const piBeforeCapture = await stripe.paymentIntents.retrieve(
      contract.stripe_payment_intent_id
    );

    const isFallback = piBeforeCapture.metadata?.type === 'platform_escrow_fallback';
    const connectAccountId = piBeforeCapture.metadata?.freelancerConnectId
      || (contract as any).freelancer?.stripe_account_id
      || null;

    // For Connect PIs, Stripe automatically routes the fee via application_fee_amount
    // and sends the rest to transfer_data.destination — just capture.
    // For fallback PIs, we capture then manually transfer the freelancer's share.
    const paymentIntent = await stripe.paymentIntents.capture(
      contract.stripe_payment_intent_id
    );

    let transferId: string | null = null;
    if (isFallback && connectAccountId) {
      // Determine freelancer amount from contract DB or PI metadata
      const freelancerCents =
        piBeforeCapture.metadata?.freelancerAmountCents
          ? parseInt(piBeforeCapture.metadata.freelancerAmountCents, 10)
          : Math.round((contract.freelancer_amount || contract.total_amount * 0.93) * 100);

      if (freelancerCents > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: freelancerCents,
            currency: 'usd',
            destination: connectAccountId,
            transfer_group: `contract_${contractId}`,
            metadata: {
              contract_id: contractId,
              payment_intent_id: paymentIntent.id,
              release_type: 'fallback_manual_split',
            },
          });
          transferId = transfer.id;
        } catch (transferErr: any) {
          // Log but don't fail — platform holds funds, admin can reconcile
          console.error('Freelancer transfer failed after capture:', transferErr.message);
        }
      }
    } else if (!isFallback && (contract as any).freelancer?.stripe_account_id) {
      // Connect PI — Stripe handled the fee automatically at capture.
      // Explicit transfer only needed if no transfer_data was set at PI creation.
      if (!piBeforeCapture.transfer_data?.destination) {
        const freelancerCents = Math.round((contract.freelancer_amount || contract.total_amount * 0.93) * 100);
        try {
          const transfer = await stripe.transfers.create({
            amount: freelancerCents,
            currency: 'usd',
            destination: (contract as any).freelancer.stripe_account_id,
            transfer_group: `contract_${contractId}`,
            metadata: { contract_id: contractId, payment_intent_id: paymentIntent.id },
          });
          transferId = transfer.id;
        } catch (transferErr: any) {
          console.error('Connect transfer failed:', transferErr.message);
        }
      }
    }

    // Update contract status
    await supabase
      .from('contracts')
      .update({
        payment_status: 'released',
        status: 'completed',
        released_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    return NextResponse.json({
      success: true,
      message: transferId
        ? 'Payment captured and transferred to freelancer'
        : isFallback
        ? 'Payment captured. Freelancer transfer pending (no Connect account).'
        : 'Payment released to freelancer',
      paymentIntentId: paymentIntent.id,
      transferId,
    });

  } catch (error: any) {
    console.error('Error releasing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to release payment' },
      { status: 500 }
    );
  }
}
