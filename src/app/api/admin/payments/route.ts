import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Fetch payments (milestones) with contract and user info
    let query = supabase
      .from('contract_milestones')
      .select(`
        id,
        amount,
        payment_status,
        created_at,
        title,
        contract:contracts!contract_milestones_contract_id_fkey (
          id,
          title,
          client:profiles!contracts_client_id_fkey (
            id,
            full_name
          ),
          freelancer:profiles!contracts_freelancer_id_fkey (
            id,
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('payment_status', status);
    }

    const { data: milestones, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Transform data to match frontend interface
    const payments = milestones?.map((m: any) => ({
      id: m.id,
      amount: m.amount,
      status: m.payment_status,
      created_at: m.created_at,
      contract_title: m.contract?.title || 'Unknown',
      client_name: m.contract?.client?.full_name || 'Unknown',
      freelancer_name: m.contract?.freelancer?.full_name || 'Unknown',
    })) || [];

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
