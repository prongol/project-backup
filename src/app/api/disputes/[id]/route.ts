import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/disputes/[id] - Update/resolve dispute
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const {
      status,
      resolution_type,
      resolution_details,
      admin_notes
    } = body;

    // Get dispute
    const { data: dispute } = await supabase
      .from('contract_disputes')
      .select('*, contract:contract_id(client_id, freelancer_id)')
      .eq('id', id)
      .single();

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    // Only admin can resolve disputes
    if (status === 'resolved' && !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can resolve disputes' },
        { status: 403 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    if (resolution_type) updateData.resolution_type = resolution_type;
    if (resolution_details) updateData.resolution_details = resolution_details;
    if (profile?.is_admin) updateData.admin_assigned = user.id;

    // Update dispute
    const { data: updatedDispute, error } = await supabase
      .from('contract_disputes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dispute:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If resolved, execute resolution
    if (status === 'resolved' && resolution_type) {
      switch (resolution_type) {
        case 'full_refund':
          // Refund client
          await supabase
            .from('contracts')
            .update({
              status: 'cancelled',
              cancellation_reason: 'Dispute resolved - full refund issued'
            })
            .eq('id', dispute.contract_id);
          break;

        case 'payment_released':
          // Release payment to freelancer
          await supabase
            .from('contract_milestones')
            .update({
              payment_status: 'released',
              approved_at: new Date().toISOString()
            })
            .eq('contract_id', dispute.contract_id)
            .eq('status', 'delivered');
          break;

        case 'partial_refund':
          // Handle partial refund logic
          // This would involve escrow management
          break;
      }

      // Close monitoring issue
      await supabase
        .from('contract_monitoring')
        .update({
          status: 'resolved',
          resolution_notes: resolution_details
        })
        .eq('contract_id', dispute.contract_id)
        .eq('issue_type', 'dispute')
        .eq('status', 'active');

      // Notify both parties
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: dispute.contract.client_id,
            type: 'dispute_resolved',
            title: 'Dispute Resolved',
            message: `The dispute has been resolved: ${resolution_type}`,
            link: `/contracts/${dispute.contract_id}/disputes/${id}`,
            read: false
          },
          {
            user_id: dispute.contract.freelancer_id,
            type: 'dispute_resolved',
            title: 'Dispute Resolved',
            message: `The dispute has been resolved: ${resolution_type}`,
            link: `/contracts/${dispute.contract_id}/disputes/${id}`,
            read: false
          }
        ]);

      // Log admin action
      if (profile?.is_admin) {
        await supabase
          .from('admin_actions')
          .insert({
            contract_id: dispute.contract_id,
            admin_id: user.id,
            action_type: 'resolved_dispute',
            action_details: {
              dispute_id: id,
              resolution_type,
              resolution_details
            },
            notes: admin_notes,
            outcome: 'resolved'
          });
      }
    }

    return NextResponse.json({
      success: true,
      dispute: updatedDispute
    });
  } catch (error: any) {
    console.error('Error in dispute PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/disputes/[id] - Get dispute details for the thread page
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    const { data: dispute, error } = await supabase
      .from('contract_disputes')
      .select(`
        id, dispute_type, reason, amount_disputed, status,
        created_at, resolved_at, resolution_type, resolution_details,
        opened_by,
        contract:contracts!contract_disputes_contract_id_fkey (
          id, title, total_amount, status,
          client:clients!contracts_client_id_fkey (
            profile_id,
            profile:profiles!clients_profile_id_fkey (
              id, full_name, avatar_url
            )
          ),
          freelancer:freelancers!contracts_freelancer_id_fkey (
            profile_id,
            profile:profiles!freelancers_profile_id_fkey (
              id, full_name, avatar_url
            )
          )
        ),
        opened_by_profile:profiles!contract_disputes_opened_by_fkey (
          id, full_name, avatar_url, role
        )
      `)
      .eq('id', id)
      .single();

    if (error || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const contract = (dispute as any).contract;
    const clientProfileId     = contract?.client?.profile_id;
    const freelancerProfileId = contract?.freelancer?.profile_id;

    const isParty =
      profile?.is_admin ||
      user.id === clientProfileId ||
      user.id === freelancerProfileId;

    if (!isParty) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      dispute: {
        ...dispute,
        currentUserRole: profile?.is_admin
          ? 'admin'
          : user.id === clientProfileId
          ? 'client'
          : 'freelancer',
        clientProfileId,
        freelancerProfileId,
        clientProfile: contract?.client?.profile,
        freelancerProfile: contract?.freelancer?.profile,
      },
    });
  } catch (error: any) {
    console.error('Error in dispute GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
