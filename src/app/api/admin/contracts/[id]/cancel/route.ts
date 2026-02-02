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

    const body = await request.json();
    const { reason } = body;

    // Get contract details
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Update contract status to cancelled
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Admin cancellation'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling contract:', updateError);
      return NextResponse.json({ error: 'Failed to cancel contract' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: 'cancel_contract',
      target_type: 'contract',
      target_id: id,
      details: { 
        reason: reason || 'Admin cancellation',
        contract_title: contract.title,
        total_amount: contract.total_amount
      }
    });

    // Log in contract activity
    await supabase.from('contract_activity_log').insert({
      contract_id: id,
      action: 'cancelled',
      description: `Contract cancelled by admin: ${reason || 'Admin cancellation'}`,
      performed_by: user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
