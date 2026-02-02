import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/contracts/[id]/approve - Approve completed work and release payment (client)
export async function POST(
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
    const { approval_note, rating, review } = body;

    // Get the contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_id (
          id,
          profile_id,
          total_earned,
          completed_jobs,
          rating,
          total_reviews
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
        { error: 'Only the client can approve work completion' },
        { status: 403 }
      );
    }

    // Check if contract is in the correct status
    if (contract.status !== 'pending_completion') {
      return NextResponse.json(
        { error: 'Contract must be submitted for completion before approval' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Calculate platform fee (7%)
    const platformFeePercentage = 7.00;
    const platformFeeAmount = (contract.total_amount * platformFeePercentage) / 100;
    const freelancerNetAmount = contract.total_amount - platformFeeAmount;

    // Update contract to completed status
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'completed',
        approval_note,
        payment_released_at: now,
        platform_fee_percentage: platformFeePercentage,
        platform_fee_amount: platformFeeAmount,
        freelancer_net_amount: freelancerNetAmount,
        updated_at: now
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error approving work:', updateError);
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
        transaction_type: 'contract_payment',
        client_id: contract.client_id,
        freelancer_id: contract.freelancer_id,
        gross_amount: contract.total_amount,
        platform_fee_amount: platformFeeAmount,
        freelancer_net_amount: freelancerNetAmount,
        platform_fee_percentage: platformFeePercentage,
        payment_status: 'completed',
        payment_method: 'bank_transfer',
        transaction_date: now,
        created_at: now
      });

    // Update freelancer stats (they receive net amount after platform fee)
    const newTotalEarned = (contract.freelancer.total_earned || 0) + freelancerNetAmount;
    const newCompletedJobs = (contract.freelancer.completed_jobs || 0) + 1;
    
    // Calculate new rating if provided
    let newRating = contract.freelancer.rating || 0;
    let newTotalReviews = contract.freelancer.total_reviews || 0;
    
    if (rating) {
      const currentTotal = (contract.freelancer.rating || 0) * (contract.freelancer.total_reviews || 0);
      newTotalReviews = (contract.freelancer.total_reviews || 0) + 1;
      newRating = (currentTotal + rating) / newTotalReviews;
    }

    await supabase
      .from('freelancers')
      .update({
        total_earned: newTotalEarned,
        completed_jobs: newCompletedJobs,
        rating: newRating,
        total_reviews: newTotalReviews,
        updated_at: now
      })
      .eq('id', contract.freelancer_id);

    // Update client stats
    const newTotalSpent = (contract.client.total_spent || 0) + contract.total_amount;
    
    await supabase
      .from('clients')
      .update({
        total_spent: newTotalSpent,
        updated_at: now
      })
      .eq('id', contract.client_id);

    // Create notification for freelancer
    await supabase
      .from('notifications')
      .insert({
        user_id: contract.freelancer.profile_id,
        type: 'payment_released',
        title: 'Payment Released! 💰',
        message: `Your work on "${contract.title}" has been approved! You will receive $${freelancerNetAmount.toFixed(2)} (after 7% platform fee) via bank transfer.`,
        link: `/contracts/${id}`,
        read: false,
        created_at: now,
      });

    // Create review if provided
    if (rating && review) {
      await supabase
        .from('reviews')
        .insert({
          contract_id: id,
          reviewer_id: contract.client_id,
          reviewee_id: contract.freelancer_id,
          reviewer_type: 'client',
          rating,
          review,
          created_at: now
        });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Work approved and payment released successfully!'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve work';
    console.error('Error approving work:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/contracts/[id]/reject - Reject completed work (request revision)
export async function PUT(
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
        { error: 'Only the client can reject work completion' },
        { status: 403 }
      );
    }

    // Check if contract is in the correct status
    if (contract.status !== 'pending_completion') {
      return NextResponse.json(
        { error: 'Contract must be submitted for completion before rejection' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update contract back to active status with rejection note
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'active',
        rejection_reason,
        completed_at: null,
        updated_at: now
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error rejecting work:', updateError);
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
        type: 'work_rejected',
        title: 'Revision Requested 🔄',
        message: `Client requested revisions on "${contract.title}". Please review the feedback and resubmit.`,
        link: `/contracts/${id}`,
        read: false,
        created_at: now,
      });

    return NextResponse.json({ 
      success: true,
      message: 'Revision requested. Freelancer has been notified.'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject work';
    console.error('Error rejecting work:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
