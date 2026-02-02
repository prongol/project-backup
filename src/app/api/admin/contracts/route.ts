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

    // Fetch contracts with client and freelancer info
    let query = supabase
      .from('contracts')
      .select(`
        id,
        title,
        status,
        total_amount,
        created_at,
        health_status,
        client:profiles!contracts_client_id_fkey (
          id,
          full_name
        ),
        freelancer:profiles!contracts_freelancer_id_fkey (
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

    const { data: contractsData, error } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    // Transform data
    const contracts = contractsData?.map((c: any) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      total_amount: c.total_amount,
      created_at: c.created_at,
      health_status: c.health_status || 'healthy',
      client_name: c.client?.full_name || 'Unknown',
      freelancer_name: c.freelancer?.full_name || 'Unknown',
    })) || [];

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
