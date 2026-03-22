import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify super admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin || profile.admin_level !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Get milestone details
    const { data: milestone, error: fetchError } = await supabase
      .from('contract_milestones')
      .select('*, contract:contracts!contract_milestones_contract_id_fkey(client_id, freelancer_id)')
      .eq('id', id)
      .single();

    if (fetchError || !milestone) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment was already released
    if (milestone.payment_status !== 'released') {
      return NextResponse.json({ error: 'Payment not eligible for refund' }, { status: 400 });
    }

    // Update payment status to refunded
    const { error: updateError } = await supabase
      .from('contract_milestones')
      .update({ 
        payment_status: 'refunded',
        refunded_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error refunding payment:', updateError);
      return NextResponse.json({ error: 'Failed to refund payment' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: 'refund_payment',
      action_details: {
        milestone_id: id,
        amount: milestone.amount,
        milestone_title: milestone.title,
        client_id: milestone.contract.client_id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
