import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const minRating = searchParams.get('minRating');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    let query = supabase
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
      return NextResponse.json({ error: 'Failed to fetch freelancers' }, { status: 500 });
    }

    return NextResponse.json({ freelancers: freelancers || [] });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}