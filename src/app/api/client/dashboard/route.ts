import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Use getUser() instead of getSession() for security
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile role and client data in one query
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden - Client access required' }, { status: 403 });
    }

    // Get or create client record
    let { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!clientData) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ profile_id: user.id })
        .select('id')
        .single();
      
      if (!newClient) {
        throw new Error('Failed to create client record');
      }
      clientData = newClient;
    }

    const clientId = clientData.id;

    // Optimize: Run all queries in parallel and reduce data fetching
    const [
      statsResult,
      { data: recentJobs },
      { data: recentContracts },
      { data: recentActivity }
    ] = await Promise.all([
      // Combined stats query - single database call
      Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'open'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['active', 'pending_completion']),
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('job_id', supabase.from('jobs').select('id').eq('client_id', clientId)),
        supabase.from('contracts').select('total_amount').eq('client_id', clientId).in('status', ['approved', 'completed'])
      ]),
      
      // Recent jobs with minimal data
      supabase
        .from('jobs')
        .select('id, title, description, budget, category, status, created_at, proposals(count)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent contracts with minimal data
      supabase
        .from('contracts')
        .select('id, title, status, total_amount, created_at, freelancer:freelancer_id(profile_id, profiles(full_name, avatar_url)), job:job_id(title, category)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent activity - simplified
      supabase
        .from('activities')
        .select('id, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const [
      { count: totalJobsPosted },
      { count: activeJobs },
      { count: activeContractsCount },
      { count: totalProposals },
      { data: spending }
    ] = statsResult;

    const totalSpending = spending?.reduce((sum, contract) => sum + (contract.total_amount || 0), 0) || 0;

    return NextResponse.json({
      stats: {
        totalJobsPosted: totalJobsPosted || 0,
        activeJobs: activeJobs || 0,
        activeContractsCount: activeContractsCount || 0,
        totalProposals: totalProposals || 0,
        totalSpending,
      },
      recentJobs: recentJobs?.map(job => ({
        ...job,
        proposalsCount: job.proposals?.[0]?.count || 0
      })) || [],
      recentContracts: recentContracts || [],
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error('Client dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
