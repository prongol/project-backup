import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';
import { notifyMilestoneApproved, notifyMilestoneRejected } from '@/lib/notifications';

// POST /api/contracts/[id]/milestones/[milestoneId]/approve - Approve milestone and release payment
export async function POST(
  request: Request,
  { params }: { params: { id: string; milestoneId: string } }
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

    const { id, milestoneId } = params;
    const body = await request.json();
    const { approval_note } = body;

    // Get the contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_id (
          id,
          profile_id,
          total_earned
        ),
        client:client_id (
          id,
          profile_id,
          total_spent
        )
      `)
      .eq('id', id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Verify user is the client
    if (contract.client.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the client can approve milestones' },
        { status: 403 }
      );
    }

    // Get the milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('contract_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('contract_id', id)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Check if milestone is in correct status
    if (milestone.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Milestone must be submitted before approval' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Calculate platform fee (7%)
    const platformFeePercentage = 7.00;
    const platformFeeAmount = (milestone.amount * platformFeePercentage) / 100;
    const freelancerNetAmount = milestone.amount - platformFeeAmount;

    // Update milestone to approved and paid
    const { error: updateError } = await supabase
      .from('contract_milestones')
      .update({
        status: 'paid',
        approval_note,
        paid_at: now,
        platform_fee_percentage: platformFeePercentage,
        platform_fee_amount: platformFeeAmount,
        freelancer_net_amount: freelancerNetAmount,
        updated_at: now
      })
      .eq('id', milestoneId);

    if (updateError) {
      console.error('Error approving milestone:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Record platform transaction
    await supabase
      .from('platform_transactions')
      .insert({
        contract_id: id,
        milestone_id: milestoneId,
        transaction_type: 'milestone_payment',
        client_id: contract.client_id,
        freelancer_id: contract.freelancer_id,
        gross_amount: milestone.amount,
        platform_fee_amount: platformFeeAmount,
        freelancer_net_amount: freelancerNetAmount,
        platform_fee_percentage: platformFeePercentage,
        payment_status: 'completed',
        payment_method: 'bank_transfer',
        transaction_date: now,
        created_at: now
      });

    // Update freelancer earnings (net amount after platform fee)
    const newTotalEarned = (contract.freelancer.total_earned || 0) + freelancerNetAmount;
    
    await supabase
      .from('freelancers')
      .update({
        total_earned: newTotalEarned,
        updated_at: now
      })
      .eq('id', contract.freelancer_id);

    // Update client spending
    const newTotalSpent = (contract.client.total_spent || 0) + milestone.amount;
    
    await supabase
      .from('clients')
      .update({
        total_spent: newTotalSpent,
        updated_at: now
      })
      .eq('id', contract.client_id);

    // Check if all milestones are completed
    const { data: allMilestones } = await supabase
      .from('contract_milestones')
      .select('id, status')
      .eq('contract_id', id);

    const allMilestonesPaid = allMilestones?.every(m => m.status === 'paid');

    // If all milestones are paid, mark contract as completed
    if (allMilestonesPaid) {
      await supabase
        .from('contracts')
        .update({
          status: 'completed',
          payment_released_at: now,
          updated_at: now
        })
        .eq('id', id);

      // Update freelancer completed jobs count
      await supabase
        .from('freelancers')
        .update({
          completed_jobs: (contract.freelancer.completed_jobs || 0) + 1,
        })
        .eq('id', contract.freelancer_id);
    }

    // Create notification for freelancer using library function
    await notifyMilestoneApproved({
      freelancerProfileId: contract.freelancer.profile_id,
      milestoneTitle: milestone.title,
      amount: freelancerNetAmount,
      contractId: id
    });

    // Send email notification to freelancer about payment
    try {
      const { data: freelancerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', contract.freelancer.profile_id)
        .single();

      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', contract.client.profile_id)
        .single();

      if (freelancerProfile && clientProfile) {
        await EmailNotifications.send(
          EmailNotifications.paymentReceived(
            freelancerProfile.full_name || 'Freelancer',
            freelancerProfile.email,
            freelancerNetAmount,
            contract.title,
            clientProfile.full_name || 'Client',
            contract.id,
            'milestone'
          )
        );
        console.log('📧 Payment received email sent to freelancer:', freelancerProfile.email);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send payment received email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Milestone approved and payment released!',
      allCompleted: allMilestonesPaid
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve milestone';
    console.error('Error approving milestone:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id]/milestones/[milestoneId]/approve - Reject milestone (request revision)
export async function PUT(
  request: Request,
  { params }: { params: { id: string; milestoneId: string } }
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

    const { id, milestoneId } = params;
    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get the contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_id (
          id,
          profile_id
        ),
        client:client_id (
          id,
          profile_id
        )
      `)
      .eq('id', id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Verify user is the client
    if (contract.client.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the client can reject milestones' },
        { status: 403 }
      );
    }

    // Get the milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('contract_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('contract_id', id)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Check if milestone is in correct status
    if (milestone.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Milestone must be submitted before rejection' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update milestone back to in_progress with rejection note
    const { error: updateError } = await supabase
      .from('contract_milestones')
      .update({
        status: 'rejected',
        rejection_reason,
        completed_at: null,
        updated_at: now
      })
      .eq('id', milestoneId);

    if (updateError) {
      console.error('Error rejecting milestone:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create notification for freelancer
    await supabase
      .from('notifications')
      .insert({
        user_id: contract.freelancer.profile_id,
        type: 'milestone_rejected',
        title: 'Milestone Revision Requested 🔄',
        message: `Client requested revisions on milestone "${milestone.title}". Please review the feedback and resubmit.`,
        link: `/contracts/${id}`,
        read: false,
        created_at: now,
      });

    return NextResponse.json({ 
      success: true,
      message: 'Revision requested. Freelancer has been notified.'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject milestone';
    console.error('Error rejecting milestone:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
