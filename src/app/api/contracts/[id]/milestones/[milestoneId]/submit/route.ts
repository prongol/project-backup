import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/contracts/[id]/milestones/[milestoneId]/submit - Submit milestone for approval
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
    const { submission_note } = body;

    // Get the contract and verify freelancer
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

    // Verify user is the freelancer
    if (contract.freelancer.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the freelancer can submit milestones' },
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
    if (!['pending', 'in_progress', 'rejected'].includes(milestone.status)) {
      return NextResponse.json(
        { error: 'Milestone cannot be submitted in current status' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update milestone to submitted
    const { error: updateError } = await supabase
      .from('contract_milestones')
      .update({
        status: 'submitted',
        submission_note,
        completed_at: now,
        updated_at: now
      })
      .eq('id', milestoneId);

    if (updateError) {
      console.error('Error submitting milestone:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create notification for client
    await supabase
      .from('notifications')
      .insert({
        user_id: contract.client.profile_id,
        type: 'milestone_submitted',
        title: 'Milestone Submitted! 📋',
        message: `Milestone "${milestone.title}" has been completed and awaits your approval.`,
        link: `/contracts/${id}`,
        read: false,
        created_at: now,
      });

    return NextResponse.json({ 
      success: true,
      message: 'Milestone submitted for approval!'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit milestone';
    console.error('Error submitting milestone:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
