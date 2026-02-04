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

    // Capture the payment (release from escrow)
    const paymentIntent = await stripe.paymentIntents.capture(
      contract.stripe_payment_intent_id
    );

    // Transfer to freelancer's Stripe Connect account
    if (contract.freelancer.stripe_account_id) {
      await stripe.transfers.create({
        amount: Math.round(contract.freelancer_amount * 100), // Convert to cents
        currency: 'usd',
        destination: contract.freelancer.stripe_account_id,
        transfer_group: `contract_${contractId}`,
        metadata: {
          contract_id: contractId,
          payment_intent_id: paymentIntent.id,
        },
      });
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
      message: 'Payment released to freelancer',
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('Error releasing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to release payment' },
      { status: 500 }
    );
  }
}
