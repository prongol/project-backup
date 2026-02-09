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
          created_at
        )
      `)
      .eq('id', freelancerId)
      .single();

    if (freelancerError) {
      console.error('Error fetching freelancer:', freelancerError);
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Get freelancer's completed contracts for portfolio/reviews
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        *,
        job:job_id (
          title,
          description,
          category,
          budget
        ),
        client:client_id (
          profile_id,
          profiles!inner (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('freelancer_id', freelancerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    // Transform contracts into portfolio items and reviews
    const portfolio = contracts?.map(contract => ({
      id: contract.id,
      title: contract.job?.title || 'Completed Project',
      description: contract.job?.description || 'Project completed successfully',
      image: `https://picsum.photos/400/300?random=${contract.id}`, // Placeholder image
      category: contract.job?.category || 'Other',
      technologies: [],
      url: null
    })) || [];

    const reviews = contracts?.map(contract => ({
      id: contract.id,
      clientName: contract.client?.profiles?.full_name || 'Anonymous Client',
      clientAvatar: contract.client?.profiles?.avatar_url || null,
      rating: 5, // Default rating for now
      comment: `Great work on ${contract.job?.title}. Professional and delivered on time.`,
      date: new Date(contract.created_at).toLocaleDateString(),
      projectTitle: contract.job?.title || 'Project'
    })) || [];

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
        rating: freelancer.rating,
        totalReviews: freelancer.total_reviews,
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