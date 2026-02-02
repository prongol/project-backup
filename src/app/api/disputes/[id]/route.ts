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

// GET /api/disputes/[id] - Get single dispute
export async function GET(
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

    const { data: dispute, error } = await supabase
      .from('contract_disputes')
      .select(`
        *,
        contract:contract_id(
          *,
          client:client_id(full_name, email, avatar_url),
          freelancer:freelancer_id(full_name, email, avatar_url)
        ),
        opener:opened_by(full_name, email, avatar_url),
        admin:admin_assigned(full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isParty = dispute.contract.client_id === user.id || 
                    dispute.contract.freelancer_id === user.id ||
                    dispute.opened_by === user.id;

    if (!profile?.is_admin && !isParty) {
      return NextResponse.json(
        { error: 'Unauthorized to view this dispute' },
        { status: 403 }
      );
    }

    return NextResponse.json({ dispute });
  } catch (error: any) {
    console.error('Error in dispute GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
