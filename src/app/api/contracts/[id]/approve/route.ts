import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Auto-release delay: 1 minute for test, 3 days for production
const AUTO_RELEASE_DELAY_MS = process.env.NODE_ENV === 'production' ? 3 * 24 * 60 * 60 * 1000 : 60 * 1000;

// POST /api/contracts/[id]/approve - Client approves work, starts auto-release timer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const { approval_note } = body;

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
    const autoReleaseAt = new Date(Date.now() + AUTO_RELEASE_DELAY_MS).toISOString();

    // Update contract - set status to 'approved' and start auto-release timer
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'approved',
        approval_note,
        auto_release_at: autoReleaseAt,
        payment_status: 'approved', // Mark payment as approved (waiting for release)
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

    const releaseMinutes = AUTO_RELEASE_DELAY_MS / (60 * 1000);
    
    // Create notification for freelancer
    await supabase
      .from('notifications')
      .insert({
        user_id: contract.freelancer.profile_id,
        type: 'contract_approved',
        title: 'Work Approved! ✅',
        message: `Your work on "${contract.title}" has been approved! Payment will auto-release in ${releaseMinutes} ${releaseMinutes === 1 ? 'minute' : 'minutes'}.`,
        link: `/contracts/${id}`,
        read: false,
        created_at: now,
      });
    
    return NextResponse.json({
      success: true,
      message: `Work approved. Payment will auto-release in ${releaseMinutes} ${releaseMinutes === 1 ? 'minute' : 'minutes'} unless a dispute is filed.`,
      auto_release_at: autoReleaseAt,
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
