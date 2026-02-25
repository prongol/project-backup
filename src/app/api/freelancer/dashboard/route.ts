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

    // Get profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'freelancer') {
      return NextResponse.json({ error: 'Forbidden - Freelancer access required' }, { status: 403 });
    }

    // Get or create freelancer record
    let { data: freelancerData } = await supabase
      .from('freelancers')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!freelancerData) {
      const { data: newFreelancer } = await supabase
        .from('freelancers')
        .insert({ 
          profile_id: user.id,
          username: user.email?.split('@')[0] || 'freelancer'
        })
        .select('id')
        .single();
      
      if (!newFreelancer) {
        throw new Error('Failed to create freelancer record');
      }
      freelancerData = newFreelancer;
    }

    const freelancerId = freelancerData.id;

    // Optimize: Batch all queries together
    const [
      statsResult,
      { data: recentContracts },
      { data: recentActivity }
    ] = await Promise.all([
      // All stats in one parallel batch
      Promise.all([
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'active'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'pending_completion'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'work_submitted'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'approved'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'completed'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'paid'),
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('freelancer_id', freelancerId).eq('status', 'pending'),
        supabase.from('contracts').select('total_amount').eq('freelancer_id', freelancerId).in('status', ['approved', 'completed', 'paid'])
      ]),
      
      // Recent contracts - minimal data only
      supabase
        .from('contracts')
        .select('id, title, status, total_amount, created_at, client:client_id(profile_id, profiles(full_name, avatar_url)), job:job_id(title, category)')
        .eq('freelancer_id', freelancerId)
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
      { count: activeCount },
      { count: pendingCompletionCount },
      { count: workSubmittedCount },
      { count: approvedCount },
      { count: completedCount },
      { count: paidCount },
      { count: pendingProposals },
      { data: earnings }
    ] = statsResult;

    const activeProjects = (activeCount || 0) + (pendingCompletionCount || 0) + (workSubmittedCount || 0);
    const completedProjectsCount = (approvedCount || 0) + (completedCount || 0) + (paidCount || 0);
    const totalEarnings = earnings?.reduce((sum, contract) => sum + (contract.total_amount || 0), 0) || 0;

    return NextResponse.json({
      stats: {
        totalEarnings,
        activeProjects,
        completedProjects: completedProjectsCount,
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
