import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { username } = await params;

    // 1. Get freelancer + profile in one join
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select(`
        *,
        profiles!inner (
          id,
          full_name,
          email,
          avatar_url,
          bio,
          avg_rating,
          total_reviews,
          created_at
        )
      `)
      .eq('username', username)
      .single();

    if (freelancerError || !freelancer) {
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // 2. Fetch real reviews from the reviews table
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

    // 3. Fetch completed contracts for portfolio
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        created_at,
        job:job_id (
          title,
          description,
          category
        )
      `)
      .eq('freelancer_id', freelancer.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. Rating distribution & breakdown from reviews table
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (rawReviews ?? []).forEach((r) => {
      const key = r.rating as 1 | 2 | 3 | 4 | 5;
      if (key >= 1 && key <= 5) ratingCounts[key]++;
    });
    const avgBreakdown =
      (rawReviews ?? []).length > 0
        ? (rawReviews ?? []).reduce((sum, r) => sum + r.rating, 0) / (rawReviews ?? []).length
        : 0;

    // 5. Shape the profile response to match what the page expects
    const profile = {
      id: freelancer.id,
      username: freelancer.username,
      full_name: freelancer.profiles.full_name,
      profile_photo: freelancer.profiles.avatar_url || '',
      professional_title: freelancer.title || '',
      location: freelancer.location || 'Nepal',
      member_since: freelancer.profiles.created_at,
      last_active: freelancer.updated_at || freelancer.profiles.created_at,
      bio: freelancer.bio || freelancer.profiles.bio || '',
      hourly_rate: freelancer.hourly_rate || 0,
      availability_status: (freelancer.availability_status || 'available') as 'available' | 'busy' | 'not_available',
      languages: freelancer.languages || [],
      skills: freelancer.skills || [],
      portfolio: (contracts ?? []).map((c) => ({
        id: c.id,
        title: (c.job as { title?: string } | null)?.title || c.title || 'Completed Project',
        description: (c.job as { description?: string } | null)?.description || 'Project completed successfully',
        images: [`https://picsum.photos/400/300?random=${c.id}`],
        link: '',
      })),
      work_experience: freelancer.work_experience || [],
      education: freelancer.education || [],
      certifications: freelancer.certifications || [],
      verification: {
        email: true,
        phone: false,
        identity: false,
        payment: false,
      },
      stats: {
        overall_rating: Number(freelancer.profiles.avg_rating) || 0,
        total_reviews: freelancer.profiles.total_reviews || 0,
        jobs_completed: freelancer.completed_jobs || 0,
        total_earned: freelancer.total_earned || 0,
        success_rate: 100,
        rehire_rate: 0,
        on_time_delivery_rate: 100,
        response_time: '< 1 hour',
      },
      ratings_breakdown: {
        communication: parseFloat(avgBreakdown.toFixed(2)),
        quality: parseFloat(avgBreakdown.toFixed(2)),
        professionalism: parseFloat(avgBreakdown.toFixed(2)),
        deadlines: parseFloat(avgBreakdown.toFixed(2)),
      },
      rating_distribution: ratingCounts,
    };

    // 6. Shape reviews
    const reviews = (rawReviews ?? []).map((r) => {
      const reviewer = r.reviewer as { full_name?: string; avatar_url?: string } | null;
      const contract = r.contracts as { title?: string } | null;
      return {
        id: r.id,
        client_name: reviewer?.full_name || 'Anonymous',
        client_username: '',
        client_photo: reviewer?.avatar_url || '',
        job_title: contract?.title || 'Completed Project',
        job_id: r.contract_id || '',
        date: r.created_at,
        overall_rating: r.rating,
        communication_rating: r.rating,
        quality_rating: r.rating,
        professionalism_rating: r.rating,
        deadlines_rating: r.rating,
        testimonial: r.comment || '',
        helpful_count: 0,
        not_helpful_count: 0,
      };
    });

    return NextResponse.json({
      profile,
      reviews,
      proposals: [], // Proposals are private — not shown on public profile
    });
  } catch (error) {
    console.error('Error fetching freelancer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
