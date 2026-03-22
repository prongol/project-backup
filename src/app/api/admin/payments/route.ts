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

    // Fetch contracts that have payment data
    let query = supabase
      .from('contracts')
      .select(`
        id,
        title,
        total_amount,
        payment_status,
        payment_amount,
        platform_fee,
        freelancer_amount,
        stripe_payment_intent_id,
        auto_release_at,
        released_at,
        paid_at,
        created_at,
        status,
        client:clients!contracts_client_id_fkey (
          profile:profiles!clients_profile_id_fkey (full_name)
        ),
        freelancer:freelancers!contracts_freelancer_id_fkey (
          profile:profiles!freelancers_profile_id_fkey (full_name)
        )
      `)
      .not('payment_status', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status !== 'all') {
      query = query.eq('payment_status', status);
    }

    const { data: contractsData, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    const payments = contractsData?.map((c: any) => ({
      id: c.id,
      contract_id: c.id,
      contract_title: c.title,
      amount: c.payment_amount || c.total_amount || 0,
      platform_fee: c.platform_fee || 0,
      freelancer_amount: c.freelancer_amount || 0,
      status: c.payment_status || 'pending',
      contract_status: c.status,
      stripe_payment_intent_id: c.stripe_payment_intent_id,
      auto_release_at: c.auto_release_at,
      released_at: c.released_at,
      paid_at: c.paid_at,
      created_at: c.created_at,
      client_name: c.client?.profile?.full_name || 'Unknown',
      freelancer_name: c.freelancer?.profile?.full_name || 'Unknown',
    })) || [];

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
