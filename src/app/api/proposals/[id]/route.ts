import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/proposals/[id] - Update proposal status (approve/reject)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();
    const { status, rejection_reason } = body;

    // Validate status
    if (!status || !['accepted', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: accepted, rejected, or pending' },
        { status: 400 }
      );
    }

    // Get the proposal with related data
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          client_id
        ),
        freelancers:freelancer_id (
          id,
          profile_id,
          profiles:profile_id (
            full_name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Get current user to verify they're the client
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is the job owner
    if (proposal.jobs.client_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the job owner can update proposal status' },
        { status: 403 }
      );
    }

    // Update the proposal
    const updateData: {
      status: string;
      updated_at: string;
      rejection_reason?: string;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: updatedProposal, error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create notification for freelancer
    const notificationType = status === 'accepted' 
      ? 'proposal_accepted' 
      : status === 'rejected' 
      ? 'proposal_rejected' 
      : 'proposal_updated';

    const notificationMessage = status === 'accepted'
      ? `Your proposal for "${proposal.jobs.title}" has been accepted! 🎉 The client will send you a contract soon.`
      : status === 'rejected'
      ? `Your proposal for "${proposal.jobs.title}" was not accepted.`
      : `Your proposal for "${proposal.jobs.title}" has been updated.`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: proposal.freelancers.profile_id,
        type: notificationType,
        title: status === 'accepted' ? 'Proposal Accepted! 🎉' : status === 'rejected' ? 'Proposal Update' : 'Proposal Updated',
        message: notificationMessage,
        link: `/freelancer/my-proposals`,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // If accepted, create a conversation between client and freelancer
    if (status === 'accepted') {
      const freelancerProfileId = proposal.freelancers.profile_id;
      const participant1 = user.id < freelancerProfileId ? user.id : freelancerProfileId;
      const participant2 = user.id < freelancerProfileId ? freelancerProfileId : user.id;

      const { error: conversationError } = await supabase
        .from('conversations')
        .upsert({
          participant_1_id: participant1,
          participant_2_id: participant2,
          job_id: proposal.job_id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'participant_1_id,participant_2_id,job_id',
          ignoreDuplicates: false,
        });

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        // Don't fail the request if conversation creation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      proposal: updatedProposal,
      message: status === 'accepted' 
        ? 'Proposal accepted! You can now create a contract and start working together.' 
        : status === 'rejected'
        ? 'Proposal rejected.'
        : 'Proposal updated.',
      redirectTo: status === 'accepted' ? `/client/contracts/create?proposal=${id}` : undefined
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update proposal';
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/proposals/[id] - Get single proposal
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          description,
          budget,
          category,
          skills,
          status,
          client_id,
          created_at
        ),
        freelancers:freelancer_id (
          id,
          title,
          skills,
          hourly_rate,
          rating,
          bio,
          profile_id,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}
