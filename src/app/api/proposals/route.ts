import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';

// GET /api/proposals - Get proposals
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('freelancerId');
    const jobId = searchParams.get('jobId');
    const proposalId = searchParams.get('proposalId');

    let query = supabase
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
          created_at
        ),
        freelancers:freelancer_id (
          id,
          title,
          skills,
          hourly_rate,
          rating,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (proposalId) {
      query = query.eq('id', proposalId);
    }

    if (freelancerId) {
      query = query.eq('freelancer_id', freelancerId);
    }
    
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching proposals:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposals: data });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Submit a proposal
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { job_id, freelancer_id, cover_letter, proposed_budget, estimated_duration } = body;

    // Validate required fields
    if (!job_id || !freelancer_id || !cover_letter || !proposed_budget || !estimated_duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate cover letter length
    if (cover_letter.length < 100) {
      return NextResponse.json(
        { error: 'Cover letter must be at least 100 characters' },
        { status: 400 }
      );
    }

    // Check if proposal already exists
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('job_id', job_id)
      .eq('freelancer_id', freelancer_id)
      .single();

    if (existingProposal) {
      return NextResponse.json(
        { error: 'You have already submitted a proposal for this job' },
        { status: 400 }
      );
    }

    // Get job details and client profile_id for notification
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id, 
        title, 
        client_id,
        clients:client_id (
          profile_id
        )
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const clientProfileId = job.clients?.profile_id;
    if (!clientProfileId) {
      return NextResponse.json(
        { error: 'Client profile not found' },
        { status: 404 }
      );
    }

    // Get freelancer details for notification
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select(`
        id,
        profile_id,
        profiles:profile_id (
          full_name
        )
      `)
      .eq('id', freelancer_id)
      .single();

    if (freelancerError || !freelancer) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Insert the proposal
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        job_id,
        freelancer_id,
        cover_letter,
        proposed_budget: parseFloat(proposed_budget),
        estimated_duration,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating proposal:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Send proposal as message to the client
    const freelancerName = freelancer.profiles?.[0]?.full_name || 'A freelancer';
    const freelancerProfileId = freelancer.profile_id;

    // Create or find conversation between freelancer and client (use clientProfileId, not job.client_id)
    const participant1 = freelancerProfileId < clientProfileId ? freelancerProfileId : clientProfileId;
    const participant2 = freelancerProfileId < clientProfileId ? clientProfileId : freelancerProfileId;

    let conversationId: string | null = null;

    // Try to find existing conversation (check both with and without job_id)
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1_id', participant1)
      .eq('participant_2_id', participant2)
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      console.log('Found existing conversation:', conversationId);
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: participant1,
          participant_2_id: participant2,
          job_id: job_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        // Try to find conversation again in case it was created by another request
        const { data: retryConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('participant_1_id', participant1)
          .eq('participant_2_id', participant2)
          .limit(1)
          .maybeSingle();
        
        if (retryConv) {
          conversationId = retryConv.id;
          console.log('Found conversation on retry:', conversationId);
        }
      } else {
        conversationId = newConv.id;
        console.log('Created new conversation:', conversationId);
      }
    }

    // Send proposal message to client
    if (conversationId) {
      const proposalMessage = `📝 **New Proposal Submitted**\n\n` +
        `I would like to work on your job: **${job.title}**\n\n` +
        `**Proposed Budget:** $${parseFloat(proposed_budget).toLocaleString()}\n` +
        `**Estimated Duration:** ${estimated_duration}\n\n` +
        `**Cover Letter:**\n${cover_letter}\n\n` +
        `View full proposal: /client/proposals/${data.id}`;

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: freelancerProfileId,
          content: proposalMessage,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending proposal message:', messageError);
        console.error('Conversation ID:', conversationId);
        console.error('Sender ID:', freelancerProfileId);
      } else {
        console.log('Proposal message sent successfully:', messageData.id);
      }
    } else {
      console.error('Failed to create or find conversation for proposal message');
    }

    // Also create notification for the client (use clientProfileId, not job.client_id)
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: clientProfileId,
        type: 'new_proposal',
        title: 'New Proposal Received! 📬',
        message: `${freelancerName} submitted a proposal for your job "${job.title}". Check your messages!`,
        link: `/communication?conversationId=${conversationId}`,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Send email notification to client about new proposal
    try {
      const { data: clientData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', clientProfileId)
        .single();

      if (clientData) {
        await EmailNotifications.send(
          EmailNotifications.proposalReceived(
            clientData.full_name || 'Client',
            clientData.email,
            freelancerName,
            job.title,
            job.id,
            data.id,
            parseFloat(proposed_budget),
            cover_letter
          )
        );
        console.log('📧 Proposal notification email sent to client:', clientData.email);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send proposal notification email:', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      proposal: data,
      conversationId: conversationId,
      message: 'Proposal submitted successfully! The client will see it in their messages.'
    });
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit proposal' },
      { status: 500 }
    );
  }
}
