import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';

// POST /api/contracts/[id]/complete - Mark contract work as complete (freelancer submits)
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
    const { completion_note } = body;

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

    // Verify user is the freelancer
    if (contract.freelancer.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the freelancer can submit work for completion' },
        { status: 403 }
      );
    }

    // Check if contract is active
    if (contract.status !== 'active') {
      return NextResponse.json(
        { error: 'Contract must be active to submit completion' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update contract to submitted status (waiting for client approval)
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'pending_completion',
        completed_at: now,
        completion_note,
        updated_at: now
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error submitting work completion:', updateError);
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
        type: 'work_submitted',
        title: 'Work Submitted for Review! 📋',
        message: `${contract.title} has been completed. Please review and approve to release payment.`,
        link: `/contracts/${id}`,
        read: false,
        created_at: now,
      });

    // Send email notification to client about work completion
    try {
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', contract.client.profile_id)
        .single();

      const { data: freelancerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', contract.freelancer.profile_id)
        .single();

      if (clientProfile && freelancerProfile) {
        await EmailNotifications.send(
          EmailNotifications.workCompleted(
            clientProfile.full_name || 'Client',
            clientProfile.email,
            freelancerProfile.full_name || 'Freelancer',
            contract.title,
            contract.id,
            completion_note || 'The freelancer has submitted the completed work for your review.'
          )
        );
        console.log('📧 Work completion email sent to client:', clientProfile.email);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send work completion email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Work submitted for client approval!'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit work completion';
    console.error('Error submitting work completion:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
