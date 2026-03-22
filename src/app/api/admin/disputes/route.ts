import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query = supabase
      .from('contract_disputes')
      .select(`
        id,
        dispute_type,
        reason,
        amount_disputed,
        status,
        created_at,
        updated_at,
        resolved_at,
        resolution_type,
        resolution_details,
        contract:contracts!contract_disputes_contract_id_fkey (
          id,
          title,
          total_amount
        ),
        opened_by_profile:profiles!contract_disputes_opened_by_fkey (
          full_name,
          email,
          role
        ),
        admin:profiles!contract_disputes_admin_assigned_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: disputes, error } = await query;

    if (error) {
      console.error('Error fetching disputes:', error);
      return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
    }

    const formatted = disputes?.map((d: any) => ({
      id: d.id,
      dispute_type: d.dispute_type,
      reason: d.reason,
      amount_disputed: d.amount_disputed,
      status: d.status,
      created_at: d.created_at,
      updated_at: d.updated_at,
      resolved_at: d.resolved_at,
      resolution_type: d.resolution_type,
      resolution_details: d.resolution_details,
      contract_id: d.contract?.id,
      contract_title: d.contract?.title || 'Unknown Contract',
      contract_amount: d.contract?.total_amount,
      opened_by_name: d.opened_by_profile?.full_name || 'Unknown',
      opened_by_email: d.opened_by_profile?.email,
      opened_by_role: d.opened_by_profile?.role,
      admin_name: d.admin?.full_name || null,
    })) || [];

    return NextResponse.json({ disputes: formatted });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/disputes - Resolve a dispute
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { dispute_id, status, resolution_type, resolution_details } = body;

    if (!dispute_id || !status) {
      return NextResponse.json({ error: 'dispute_id and status are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('contract_disputes')
      .update({
        status,
        resolution_type: resolution_type || null,
        resolution_details: resolution_details || null,
        admin_assigned: user.id,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispute_id);

    if (error) {
      console.error('Error resolving dispute:', error);
      return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
