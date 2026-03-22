import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const freelancerId = params.id;

    // Get freelancer with profile data
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select(`
        *,
        profiles!inner (
          id,
          full_name,
          email,
          avatar_url,
          avg_rating,
          total_reviews,
          created_at
        )
      `)
      .eq('id', freelancerId)
      .single();

    if (freelancerError) {
      console.error('Error fetching freelancer:', freelancerError);
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Get freelancer's completed contracts for portfolio
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        *,
        job:job_id (
          title,
          description,
          category,
          budget
        )
      `)
      .eq('freelancer_id', freelancerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get real reviews from the reviews table
    const { data: rawReviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        contract_id,
        reviewer:reviewer_id (
          full_name,
          avatar_url
        ),
        contracts!contract_id (
          title
        )
      `)
      .eq('reviewee_id', freelancer.profiles.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // Transform contracts into portfolio items
    const portfolio = contracts?.map(contract => ({
      id: contract.id,
      title: (contract.job as { title?: string } | null)?.title || 'Completed Project',
      description: (contract.job as { description?: string } | null)?.description || 'Project completed successfully',
      image: `https://picsum.photos/400/300?random=${contract.id}`,
      category: (contract.job as { category?: string } | null)?.category || 'Other',
      technologies: [],
      url: null
    })) || [];

    // Shape real reviews
    const reviews = (rawReviews ?? []).map(r => {
      const reviewer = r.reviewer as { full_name?: string; avatar_url?: string } | null;
      const contract = r.contracts as { title?: string } | null;
      return {
        id: r.id,
        clientName: reviewer?.full_name || 'Anonymous Client',
        clientAvatar: reviewer?.avatar_url || null,
        rating: r.rating,
        comment: r.comment || '',
        date: new Date(r.created_at).toLocaleDateString(),
        projectTitle: contract?.title || 'Project'
      };
    });

    const response = {
      freelancer: {
        id: freelancer.id,
        name: freelancer.profiles.full_name,
        username: freelancer.username,
        title: freelancer.title,
        bio: freelancer.bio,
        avatar: freelancer.profiles.avatar_url,
        location: 'Remote', // Add location field to freelancers table if needed
        hourlyRate: freelancer.hourly_rate,
        rating: Number(freelancer.profiles.avg_rating) || 0,
        totalReviews: freelancer.profiles.total_reviews || 0,
        completedJobs: freelancer.completed_jobs,
        skills: freelancer.skills || [],
        totalEarned: freelancer.total_earned,
        memberSince: new Date(freelancer.profiles.created_at).toLocaleDateString(),
        isOnline: freelancer.status === 'online',
        responseTime: '< 1 hour', // Add response_time field if needed
        portfolioUrl: freelancer.portfolio_url,
        githubUrl: freelancer.github_url,
        linkedinUrl: freelancer.linkedin_url
      },
      portfolio,
      reviews,
      stats: {
        totalProjects: contracts?.length || 0,
        repeatClients: Math.floor((contracts?.length || 0) * 0.3), // Estimate
        onTimeDelivery: 98 // Default
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}