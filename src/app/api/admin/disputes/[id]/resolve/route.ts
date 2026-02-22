import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: disputeId } = await params;
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get resolution details from request
    const body = await request.json();
    const { resolution_type, resolution_details, admin_notes } = body;

    if (!resolution_type || !resolution_details) {
      return NextResponse.json({ 
        error: 'Resolution type and details are required' 
      }, { status: 400 });
    }

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('contract_disputes')
      .select(`
        *,
        contract:contracts (
          id,
          status,
          total_amount,
          freelancer_id,
          job:jobs (id, title, client_id)
        )
      `)
      .eq('id', disputeId)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Update dispute with resolution
    const { error: updateError } = await supabase
      .from('contract_disputes')
      .update({
        status: 'resolved',
        resolution_type,
        resolution_details,
        admin_notes,
        admin_assigned: user.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (updateError) {
      console.error('Error resolving dispute:', updateError);
      return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 });
    }

    // Update contract status based on resolution
    let newContractStatus = 'cancelled';
    if (resolution_type === 'payment_released') {
      newContractStatus = 'completed';
    } else if (resolution_type === 'additional_work') {
      newContractStatus = 'active';
    }

    await supabase
      .from('contracts')
      .update({ status: newContractStatus })
      .eq('id', dispute.contract_id);

    // Record in contract history
    await supabase
      .from('contract_history')
      .insert({
        contract_id: dispute.contract_id,
        user_id: user.id,
        change_type: 'dispute_resolved',
        details: {
          dispute_id: disputeId,
          resolution_type,
          resolved_by_admin: profile.full_name,
          resolution: resolution_details.substring(0, 200)
        }
      });

    // Notify both parties
    const notifications = [
      {
        user_id: dispute.contract.job.client_id,
        title: 'Dispute Resolved',
        message: `Admin has resolved the dispute on "${dispute.contract.job.title}": ${resolution_type.replace('_', ' ')}`,
        type: 'dispute_resolved',
        link: `/contracts/${dispute.contract_id}`
      },
      {
        user_id: dispute.contract.freelancer_id,
        title: 'Dispute Resolved',
        message: `Admin has resolved the dispute on "${dispute.contract.job.title}": ${resolution_type.replace('_', ' ')}`,
        type: 'dispute_resolved',
        link: `/contracts/${dispute.contract_id}`
      }
    ];

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({ 
      success: true,
      message: 'Dispute resolved successfully'
    });

  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}
