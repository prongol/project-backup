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

    // Fetch payments (transactions) with contract and user info
    let query = supabase
      .from('transactions')
      .select(`
        id,
        amount,
        status,
        created_at,
        type,
        contract:contracts (
          id,
          title
        ),
        sender:profiles!transactions_from_user_id_fkey (
          id,
          full_name
        ),
        receiver:profiles!transactions_to_user_id_fkey (
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Transform data to match frontend interface
    const payments = transactions?.map((t: any) => ({
      id: t.id,
      amount: t.amount,
      status: t.status,
      created_at: t.created_at,
      contract_title: t.contract?.title || 'System Transaction',
      client_name: t.sender?.full_name || 'System',
      freelancer_name: t.receiver?.full_name || 'N/A',
      type: t.type
    })) || [];

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
