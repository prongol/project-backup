import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';

// POST /api/contracts/[id]/review - Client reviews and approves/requests revisions
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
    const { action, reviewNotes, approvalChecklist, submissionId } = await req.json();

    // Verify contract and user authorization
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, client_id, freelancer_id, status, title, budget,
        clients!inner(profile_id, profiles!inner(full_name, email)),
        freelancers!inner(profile_id, profiles!inner(full_name, email))
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.clients[0]?.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you are not the client for this contract' },
        { status: 403 }
      );
    }

    if (!['work_submitted', 'revision_requested'].includes(contract.status)) {
      return NextResponse.json(
        { error: 'No work to review for this contract' },
        { status: 400 }
      );
    }

    // Update work review
    const { error: reviewUpdateError } = await supabase
      .from('work_reviews')
      .update({
        review_status: action,
        review_notes: reviewNotes,
        approval_checklist: approvalChecklist,
        reviewed_at: new Date().toISOString()
      })
      .eq('contract_id', contractId)
      .eq('submission_id', submissionId);

    if (reviewUpdateError) {
      console.error('Review update error:', reviewUpdateError);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    // Update submission status
    await supabase
      .from('contract_submissions')
      .update({
        status: action === 'approved' ? 'approved' : 'revision_requested',
        client_feedback: reviewNotes,
        client_viewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (action === 'approved') {
      // Approve work - trigger payment release
      await supabase
        .from('contracts')
        .update({
          status: 'completed',
          payment_hold_released: true,
          payment_release_method: 'manual',
          payment_released_at: new Date().toISOString()
        })
        .eq('id', contractId);

      // Update escrow account
      await supabase
        .from('escrow_accounts')
        .update({
          status: 'approved',
          client_approved_at: new Date().toISOString(),
          payment_hold_released: true
        })
        .eq('contract_id', contractId);

      // Release payment via Stripe
      const { data: escrowAccount } = await supabase
        .from('escrow_accounts')
        .select('stripe_payment_intent_id')
        .eq('contract_id', contractId)
        .single();

      if (escrowAccount?.stripe_payment_intent_id) {
        // This would trigger the actual Stripe payment release
        // You might want to call the escrow API endpoint here
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/escrow`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'release',
            paymentIntentId: escrowAccount.stripe_payment_intent_id,
            contractId: contractId
          })
        });
      }

      // Send notification to freelancer
      await supabase
        .from('notifications')
        .insert({
          user_id: contract.freelancers[0]?.profile_id,
          type: 'work_approved',
          title: '🎉 Work Approved - Payment Released!',
          message: 'Your work has been approved and payment has been released to your account.',
          action_url: `/freelancer/contracts/${contractId}`
        });
      
      // Send completion emails to both parties
      const freelancerProfile = contract.freelancers[0]?.profiles;
      const clientProfile = contract.clients[0]?.profiles;
      
      if (freelancerProfile?.full_name && freelancerProfile?.email) {
        await EmailNotifications.send(
          EmailNotifications.contractCompleted(
            freelancerProfile.full_name,
            freelancerProfile.email,
            contract.title,
            contractId,
            contract.budget || 0,
            clientProfile?.full_name || 'Client',
            true // isFreelancer
          )
        );
      }
      
      if (clientProfile?.full_name && clientProfile?.email) {
        await EmailNotifications.send(
          EmailNotifications.contractCompleted(
            clientProfile.full_name,
            clientProfile.email,
            contract.title,
            contractId,
            contract.budget || 0,
            freelancerProfile?.full_name || 'Freelancer',
            false // isFreelancer
          )
        );
      }

    } else if (action === 'revision_requested') {
      // Request revisions
      await supabase
        .from('contracts')
        .update({
          status: 'revision_requested'
        })
        .eq('id', contractId);

      // Send notification to freelancer
      await supabase
        .from('notifications')
        .insert({
          user_id: contract.freelancers[0]?.profile_id,
          type: 'revision_requested',
          title: 'Revision Requested',
          message: 'The client has requested revisions to your work. Please check the feedback and resubmit.',
          action_url: `/freelancer/contracts/${contractId}`
        });

    } else if (action === 'disputed') {
      // Start dispute process
      await supabase
        .from('contracts')
        .update({
          status: 'disputed'
        })
        .eq('id', contractId);

      // This would typically redirect to dispute creation
      return NextResponse.json({
        success: true,
        action: 'redirect_to_dispute',
        redirectUrl: `/contracts/${contractId}/dispute`
      });
    }

    return NextResponse.json({
      success: true,
      action,
      message: action === 'approved' 
        ? 'Work approved and payment released!' 
        : action === 'revision_requested'
        ? 'Revision request sent to freelancer'
        : 'Review completed'
    });

  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}