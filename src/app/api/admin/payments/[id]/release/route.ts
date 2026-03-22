import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// POST /api/admin/payments/[id]/release - Instantly release escrowed funds to freelancer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: contractId } = await params;

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get contract with freelancer's Stripe account (use adminClient to bypass RLS)
    const adminSupabase = createAdminClient();
    const { data: contract, error: fetchError } = await adminSupabase
      .from('contracts')
      .select(`
        id, title, payment_status, stripe_payment_intent_id,
        total_amount, platform_fee, freelancer_amount,
        freelancer:freelancers!contracts_freelancer_id_fkey (
          id,
          stripe_account_id,
          profile:profiles!freelancers_profile_id_fkey (full_name)
        )
      `)
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.payment_status === 'released') {
      return NextResponse.json({ error: 'Funds already released' }, { status: 400 });
    }

    const freelancer = (contract as any).freelancer;
    const stripeAccountId = freelancer?.stripe_account_id; // correct column
    const releaseAmount = contract.freelancer_amount || Math.round(contract.total_amount * 0.93 * 100) / 100;

    let stripeTransferId: string | null = null;

    if (contract.stripe_payment_intent_id) {
      try {
        // Retrieve PI — if it's still in requires_capture state, capture it first
        const pi = await stripe.paymentIntents.retrieve(contract.stripe_payment_intent_id);
        const isFallback = pi.metadata?.type === 'platform_escrow_fallback';

        if (pi.status === 'requires_capture') {
          await stripe.paymentIntents.capture(contract.stripe_payment_intent_id);
        }

        // For both fallback and Connect PIs without transfer_data, do explicit transfer
        const needsManualTransfer = isFallback || !pi.transfer_data?.destination;

        if (stripeAccountId && releaseAmount > 0 && needsManualTransfer) {
          const transfer = await stripe.transfers.create({
            amount: Math.round(releaseAmount * 100),
            currency: 'usd',
            destination: stripeAccountId,
            transfer_group: contractId,
            metadata: {
              contract_id: contractId,
              released_by_admin: user.id,
              release_type: 'instant_admin_release',
            },
          });
          stripeTransferId = transfer.id;
        }
      } catch (stripeError: any) {
        console.error('Stripe capture/transfer error:', stripeError.message);
        // Continue to update DB — admin can reconcile in Stripe dashboard
      }
    }

    // Update contract payment status
    const { error: updateError } = await adminSupabase
      .from('contracts')
      .update({
        payment_status: 'released',
        payment_release_method: 'admin_instant_release',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Error releasing payment:', updateError);
      return NextResponse.json({ error: 'Failed to release payment' }, { status: 500 });
    }

    // Log admin action
    await adminSupabase.from('admin_actions').insert({
      admin_id: user.id,
      contract_id: contractId,
      action_type: 'release_payment',
      action_details: {
        contract_title: contract.title,
        amount: releaseAmount,
        stripe_transfer_id: stripeTransferId,
        freelancer_stripe_account: stripeAccountId,
        release_type: 'instant_admin_release',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Funds released${stripeTransferId ? ' via Stripe' : ' (DB updated, Stripe transfer pending)'}`,
      stripe_transfer_id: stripeTransferId,
    });
  } catch (error) {
    console.error('Release payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
