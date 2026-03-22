import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// POST /api/admin/payments/[id]/hold - Withhold funds (pause auto-release)
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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Admin hold — under review';

    // Use admin client to bypass RLS for contract operations
    const adminSupabase = createAdminClient();

    // Get contract
    const { data: contract, error: fetchError } = await adminSupabase
      .from('contracts')
      .select('id, title, stripe_payment_intent_id, payment_status, total_amount')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // If there's a Stripe payment intent, add metadata to flag it as held
    if (contract.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.update(contract.stripe_payment_intent_id, {
          metadata: {
            admin_hold: 'true',
            hold_reason: reason,
            held_at: new Date().toISOString(),
            held_by: user.id,
          },
        });
      } catch (stripeError: any) {
        console.warn('Stripe update warning (non-fatal):', stripeError.message);
      }
    }

    // Update contract: set payment_status to 'held', clear auto_release_at
    const { error: updateError } = await adminSupabase
      .from('contracts')
      .update({
        payment_status: 'held',
        auto_release_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Error holding payment:', updateError);
      return NextResponse.json({ error: 'Failed to hold payment' }, { status: 500 });
    }

    // Log admin action
    await adminSupabase.from('admin_actions').insert({
      admin_id: user.id,
      contract_id: contractId,
      action_type: 'hold_payment',
      action_details: {
        reason,
        contract_title: contract.title,
        amount: contract.total_amount,
        stripe_payment_intent_id: contract.stripe_payment_intent_id,
      },
    });

    return NextResponse.json({ success: true, message: 'Funds are now on hold' });
  } catch (error) {
    console.error('Hold payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
