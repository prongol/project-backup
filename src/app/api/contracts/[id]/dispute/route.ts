import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/contracts/[id]/dispute - Create a dispute and pause auto-release timer
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: contractId } = await params;
    const { disputeType, reason, evidence, amountDisputed } = await req.json();

    // Verify contract and user authorization
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, client_id, freelancer_id, total_amount, status,
        client_requirements, deliverable_checklist,
        clients!inner(profile_id),
        freelancers!inner(profile_id)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the contract
    const isClient = contract.clients[0]?.profile_id === user.id;
    const isFreelancer = contract.freelancers[0]?.profile_id === user.id;
    
    if (!isClient && !isFreelancer) {
      return NextResponse.json(
        { error: 'You are not authorized to create a dispute for this contract' },
        { status: 403 }
      );
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('contract_disputes')
      .insert({
        contract_id: contractId,
        opened_by: user.id,
        dispute_type: disputeType,
        reason: reason,
        evidence: evidence || [],
        amount_disputed: amountDisputed,
        status: 'open'
      })
      .select()
      .single();

    if (disputeError) {
      console.error('Dispute creation error:', disputeError);
      return NextResponse.json(
        { error: 'Failed to create dispute' },
        { status: 500 }
      );
    }

    // Add evidence records if provided
    if (evidence && evidence.length > 0) {
      const evidenceRecords = evidence.map((item: any) => ({
        dispute_id: dispute.id,
        submitted_by: user.id,
        evidence_type: item.type,
        file_url: item.url,
        description: item.description,
        metadata: item.metadata || {}
      }));

      await supabase
        .from('dispute_evidence')
        .insert(evidenceRecords);
    }

    // Create requirement verifications for admin review
    if (contract.client_requirements && typeof contract.client_requirements === 'object') {
      const requirements = Object.entries(contract.client_requirements);
      const verificationRecords = requirements.map(([key, value]) => ({
        contract_id: contractId,
        requirement_id: key,
        requirement_text: value as string,
        verification_status: 'pending'
      }));

      await supabase
        .from('requirement_verifications')
        .insert(verificationRecords);
    }

    // Update contract status and PAUSE auto-release timer
    await supabase
      .from('contracts')
      .update({
        status: 'disputed',
        dispute_reason: reason,
        disputed_at: new Date().toISOString(),
        dispute_status: 'under_review',
        auto_release_at: null, // Clear auto-release timer
        payment_status: 'disputed' // Hold payment
      })
      .eq('id', contractId);

    // Notify the other party
    const otherPartyId = isClient ? contract.freelancers[0]?.profile_id : contract.clients[0]?.profile_id;
    await supabase
      .from('notifications')
      .insert({
        user_id: otherPartyId,
        type: 'dispute_opened',
        title: '⚠️ Dispute Opened',
        message: `A dispute has been opened for your contract. Please review and provide your response.`,
        action_url: `/contracts/${contractId}/dispute/${dispute.id}`
      });

    // Notify admin about new dispute
    await supabase
      .from('notifications')
      .insert({
        user_id: 'admin', // You'll need to handle admin notifications
        type: 'new_dispute',
        title: 'New Dispute Requires Review',
        message: `A new dispute has been opened and requires admin attention.`,
        action_url: `/admin/disputes/${dispute.id}`
      });

    return NextResponse.json({
      success: true,
      dispute,
      message: 'Dispute created successfully. An admin will review and resolve this within 3-5 business days.'
    });

  } catch (error: any) {
    console.error('Dispute creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dispute' },
      { status: 500 }
    );
  }
}

// GET /api/contracts/[id]/dispute - Get dispute details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Get dispute with all related data
    const { data: dispute, error: disputeError } = await supabase
      .from('contract_disputes')
      .select(`
        *,
        dispute_evidence(*),
        requirement_verifications(*),
        contracts!inner(
          id, client_id, freelancer_id,
          client_requirements, deliverable_checklist
        )
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const contract = dispute.contracts;
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      dispute,
      clientRequirements: contract.client_requirements,
      deliverableChecklist: contract.deliverable_checklist
    });

  } catch (error: any) {
    console.error('Dispute fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispute details' },
      { status: 500 }
    );
  }
}