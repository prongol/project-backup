import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyProposalAccepted, notifyProposalRejected } from '@/lib/notifications';
import { EmailNotifications } from '@/lib/notificationEmails';

// PATCH /api/proposals/[id] - Update proposal status (approve/reject)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { status, rejection_reason } = body;

    // Validate status
    if (!status || !['accepted', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: accepted, rejected, or pending' },
        { status: 400 }
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

    // Get the proposal with related data (include clients join to get profile_id)
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          client_id,
          clients:client_id (
            profile_id
          )
        ),
        freelancers:freelancer_id (
          id,
          profile_id,
          profiles:profile_id (
            full_name,
            email
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

    // Resolve the client profile_id from the nested clients join
    const jobClients = proposal.jobs.clients;
    const clientProfileId = Array.isArray(jobClients)
      ? jobClients[0]?.profile_id
      : jobClients?.profile_id;

    // Verify the user is the job owner (compare auth user id with client's profile_id)
    if (clientProfileId !== user.id) {
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

    // Send notification to freelancer
    try {
      const freelancerProfileId = proposal.freelancers.profile_id;
      
      if (status === 'accepted') {
        await notifyProposalAccepted({
          freelancerProfileId: freelancerProfileId,
          jobTitle: proposal.jobs.title,
          contractId: '' // Contract will be created separately
        });
      } else if (status === 'rejected') {
        await notifyProposalRejected({
          freelancerProfileId: freelancerProfileId,
          jobTitle: proposal.jobs.title
        });

        // Send decline email to the freelancer
        const freelancerProfiles = proposal.freelancers.profiles;
        const freelancerProfile = Array.isArray(freelancerProfiles)
          ? freelancerProfiles[0]
          : freelancerProfiles;

        if (freelancerProfile?.email) {
          try {
            // Get client name from their profile
            const { data: clientProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();

            await EmailNotifications.send(
              EmailNotifications.proposalDeclined(
                freelancerProfile.full_name || 'Freelancer',
                freelancerProfile.email,
                clientProfile?.full_name || 'Client',
                proposal.jobs.title,
                rejection_reason
              )
            );
            console.log('📧 Proposal decline email sent to:', freelancerProfile.email);
          } catch (emailError) {
            console.error('⚠️ Failed to send decline email:', emailError);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
