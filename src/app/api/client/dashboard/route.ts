import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden - Client access required' }, { status: 403 });
    }

    // First, get the client's ID from the clients table
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', session.user.id)
      .single();

    if (!clientData) {
      // If no client record exists, create one
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ profile_id: session.user.id })
        .select('id')
        .single();
      
      if (!newClient) {
        throw new Error('Failed to create client record');
      }
      clientData!.id = newClient.id;
    }

    // Get stats in parallel
    const [
      { count: totalJobsPosted },
      { count: activeJobs },
      { count: totalProposals },
      { data: spending }
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientData?.id || ''),
      
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientData?.id || '')
        .eq('status', 'open'),
      
      supabase
        .from('proposals')
        .select('job:job_id!inner(client_id)', { count: 'exact', head: true })
        .eq('job.client_id', clientData?.id || ''),
      
      supabase
        .from('contracts')
        .select('total_amount')
        .eq('client_id', clientData?.id || '')
        .eq('status', 'completed')
    ]);

    const totalSpending = spending?.reduce((sum, contract) => sum + (contract.total_amount || 0), 0) || 0;

    // Get recent jobs
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select(`
        *,
        proposals(count)
      `)
      .eq('client_id', clientData?.id || '')
      .order('created_at', { ascending: false })
      .limit(5);

    // Transform the data to match expected format
    const jobsWithProposalCount = recentJobs?.map(job => ({
      ...job,
      proposalsCount: job.proposals?.[0]?.count || 0
    })) || [];

    // Get recent contracts
    const { data: recentContracts } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_id(profile_id, profiles!inner(full_name, avatar_url)),
        job:job_id(title, category)
      `)
      .eq('client_id', clientData?.id || '')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      stats: {
        totalJobsPosted: totalJobsPosted || 0,
        activeJobs: activeJobs || 0,
        totalProposals: totalProposals || 0,
        totalSpending,
      },
      recentJobs: jobsWithProposalCount,
      recentContracts: recentContracts || [],
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error('Client dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
