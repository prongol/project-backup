import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyWorkSubmitted } from '@/lib/notifications';
import { EmailNotifications } from '@/lib/notificationEmails';

// POST /api/contracts/[id]/submit - Freelancer submits work
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: contractId } = params;
    const { deliverables, message, submissionType = 'final' } = await req.json();

    // Verify contract and user authorization
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, 
        title,
        client_id, 
        freelancer_id, 
        status, 
        freelancers!inner(profile_id),
        clients!inner(profile_id, profiles!inner(full_name))
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.freelancers[0]?.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you are not the freelancer for this contract' },
        { status: 403 }
      );
    }

    if (contract.status !== 'active') {
      return NextResponse.json(
        { error: 'Contract is not active' },
        { status: 400 }
      );
    }

    // Create work submission
    const { data: submission, error: submissionError } = await supabase
      .from('contract_submissions')
      .insert({
        contract_id: contractId,
        freelancer_id: user.id,
        submission_type: submissionType,
        deliverables: deliverables,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Submission creation error:', submissionError);
      return NextResponse.json(
        { error: 'Failed to submit work' },
        { status: 500 }
      );
    }

    // Update contract status to work_submitted
    await supabase
      .from('contracts')
      .update({
        status: 'work_submitted',
        work_approval_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
      })
      .eq('id', contractId);

    // Get freelancer name and notify client
    const { data: freelancerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const clientProfileId = contract.clients?.[0]?.profile_id;
    const clientProfile = contract.clients?.[0]?.profiles;
    
    if (clientProfileId && freelancerProfile) {
      // In-app notification
      await notifyWorkSubmitted({
        clientProfileId,
        contractTitle: contract.title,
        contractId,
        freelancerName: freelancerProfile.full_name || 'Freelancer'
      });
      
      // Email notification
      if (clientProfile?.full_name && clientProfile?.email) {
        await EmailNotifications.send(
          EmailNotifications.workSubmitted(
            clientProfile.full_name,
            clientProfile.email,
            freelancerProfile.full_name || 'Freelancer',
            contract.title,
            contractId,
            deliverables
          )
        );
      }
    }

    // Trigger will automatically:
    // 1. Start review period in escrow_accounts
    // 2. Create work_reviews entry
    // 3. Send notification to client

    return NextResponse.json({
      success: true,
      submission,
      message: 'Work submitted successfully. Client has 3 days to review.'
    });

  } catch (error: any) {
    console.error('Work submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit work' },
      { status: 500 }
    );
  }
}