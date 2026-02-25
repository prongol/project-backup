import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyDisputeFiled } from '@/lib/notifications';

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
    const body = await req.json();
    const disputeType = body.dispute_type || body.disputeType;
    const reason = body.reason;
    const evidence = body.evidence;
    const amountDisputed = body.amount_disputed || body.amountDisputed;

    // Verify contract exists and user authorization
    // Join with clients and freelancers to get profile_id for authorization
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, 
        client_id, 
        freelancer_id, 
        total_amount, 
        status,
        clients!contracts_client_id_fkey(profile_id),
        freelancers!contracts_freelancer_id_fkey(profile_id)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Contract fetch error:', contractError);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the contract (either client or freelancer)
    // Compare with profile_id from joined tables
    const clientProfileId = (contract.clients as any)?.profile_id;
    const freelancerProfileId = (contract.freelancers as any)?.profile_id;
    
    const isClient = clientProfileId === user.id;
    const isFreelancer = freelancerProfileId === user.id;
    
    if (!isClient && !isFreelancer) {
      return NextResponse.json(
        { error: 'You are not authorized to create a dispute for this contract' },
        { status: 403 }
      );
    }

    // Create dispute
    const disputeData = {
      contract_id: contractId,
      opened_by: user.id,
      dispute_type: disputeType,
      reason: reason,
      evidence: evidence || [],
      amount_disputed: amountDisputed,
      status: 'open'
    };
    
    console.log('Creating dispute with data:', disputeData);
    
    const { data: dispute, error: disputeError } = await supabase
      .from('contract_disputes')
      .insert(disputeData)
      .select()
      .single();

    if (disputeError) {
      console.error('Dispute creation error:', disputeError);
      console.error('User ID:', user.id);
      console.error('Contract ID:', contractId);
      return NextResponse.json(
        { error: 'Failed to create dispute', details: disputeError.message },
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

    // Get contract title for notification
    const { data: contractData } = await supabase
      .from('contracts')
      .select('title')
      .eq('id', contractId)
      .single();

    // Notify the other party
    const otherPartyId = isClient ? contract.freelancer_id : contract.client_id;
    if (otherPartyId && contractData) {
      await notifyDisputeFiled({
        recipientProfileId: otherPartyId,
        contractTitle: contractData.title,
        contractId: contractId,
        disputeId: dispute.id,
        filerRole: isClient ? 'client' : 'freelancer'
      });
    }

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