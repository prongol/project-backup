import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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

    if (profile?.role !== 'freelancer') {
      return NextResponse.json({ error: 'Forbidden - Freelancer access required' }, { status: 403 });
    }

    // First, get the freelancer's ID from the freelancers table
    const { data: freelancerData } = await supabase
      .from('freelancers')
      .select('id')
      .eq('profile_id', session.user.id)
      .single();

    if (!freelancerData) {
      // If no freelancer record exists, create one
      const { data: newFreelancer } = await supabase
        .from('freelancers')
        .insert({ 
          profile_id: session.user.id,
          username: session.user.email?.split('@')[0] || 'freelancer'
        })
        .select('id')
        .single();
      
      if (!newFreelancer) {
        throw new Error('Failed to create freelancer record');
      }
      freelancerData!.id = newFreelancer.id;
    }

    // Get stats in parallel
    const [
      { count: activeProjects },
      { count: completedProjects },
      { count: pendingProposals },
      { data: earnings }
    ] = await Promise.all([
      supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerData?.id || '')
        .eq('status', 'active'),
      
      supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerData?.id || '')
        .eq('status', 'completed'),
      
      supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerData?.id || '')
        .eq('status', 'pending'),
      
      supabase
        .from('contracts')
        .select('total_amount')
        .eq('freelancer_id', freelancerData?.id || '')
        .eq('status', 'completed')
    ]);

    const totalEarnings = earnings?.reduce((sum, contract) => sum + (contract.total_amount || 0), 0) || 0;

    // Get recent contracts
    const { data: recentContracts } = await supabase
      .from('contracts')
      .select(`
        *,
        client:client_id(profile_id, profiles!inner(full_name, avatar_url)),
        job:job_id(title, category)
      `)
      .eq('freelancer_id', freelancerData?.id || '')
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
        totalEarnings,
        activeProjects: activeProjects || 0,
        completedProjects: completedProjects || 0,
        pendingApplications: pendingProposals || 0,
      },
      recentContracts: recentContracts || [],
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error('Freelancer dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
