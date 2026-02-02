import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/disputes - Get disputes for user or admin
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractId = searchParams.get('contract_id');

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('contract_disputes')
      .select(`
        *,
        contract:contract_id(
          id,
          title,
          total_amount,
          client:client_id(full_name, email),
          freelancer:freelancer_id(full_name, email)
        ),
        opener:opened_by(full_name, email),
        admin:admin_assigned(full_name, email)
      `)
      .order('created_at', { ascending: false });

    // If not admin, only show disputes related to user's contracts
    if (!profile?.is_admin) {
      query = query.or(`opened_by.eq.${user.id},contract_id.in.(SELECT id FROM contracts WHERE client_id = ${user.id} OR freelancer_id = ${user.id})`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (contractId) {
      query = query.eq('contract_id', contractId);
    }

    const { data: disputes, error } = await query;

    if (error) {
      console.error('Error fetching disputes:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ disputes });
  } catch (error: any) {
    console.error('Error in disputes GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/disputes - Create new dispute
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      contract_id,
      dispute_type,
      reason,
      evidence,
      amount_disputed
    } = body;

    // Verify user is part of the contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('client_id, freelancer_id')
      .eq('id', contract_id)
      .single();

    if (!contract || (contract.client_id !== user.id && contract.freelancer_id !== user.id)) {
      return NextResponse.json(
        { error: 'You are not authorized to create a dispute for this contract' },
        { status: 403 }
      );
    }

    // Create dispute
    const { data: dispute, error } = await supabase
      .from('contract_disputes')
      .insert({
        contract_id,
        opened_by: user.id,
        dispute_type,
        reason,
        evidence: evidence || [],
        amount_disputed,
        status: 'open'
      })
      .select(`
        *,
        contract:contract_id(title),
        opener:opened_by(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating dispute:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Create monitoring issue for the dispute
    await supabase
      .from('contract_monitoring')
      .insert({
        contract_id,
        issue_type: 'dispute',
        risk_level: 'HIGH',
        risk_score: 75,
        flags: [`Dispute opened: ${dispute_type}`]
      });

    // Send notifications to both parties and admins
    const otherParty = contract.client_id === user.id ? contract.freelancer_id : contract.client_id;
    
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: otherParty,
          type: 'dispute_opened',
          title: 'Dispute Opened on Contract',
          message: `A dispute has been opened on the contract. Please review the details.`,
          link: `/contracts/${contract_id}/disputes/${dispute.id}`,
          read: false
        }
      ]);

    return NextResponse.json({
      success: true,
      dispute
    });
  } catch (error: any) {
    console.error('Error in disputes POST:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
