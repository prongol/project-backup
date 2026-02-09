import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const minRating = searchParams.get('minRating');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    let query = supabase
      .from('freelancers')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email,
          avatar_url,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category && category !== 'All Categories') {
      query = query.contains('skills', [category]);
    }

    if (minRating) {
      query = query.gte('rating', parseFloat(minRating));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,bio.ilike.%${search}%,skills.cs.{${search}}`);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: freelancers, error } = await query;

    if (error) {
      console.error('Database error:', error);
      // Return empty array instead of error for better UX
      return NextResponse.json({ freelancers: [] });
    }

    return NextResponse.json({ freelancers: freelancers || [] });

  } catch (error) {
    console.error('Server error:', error);
    // Return empty array instead of error for better UX
    return NextResponse.json({ freelancers: [] });
  }
}