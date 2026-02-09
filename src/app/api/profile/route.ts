import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, bio, title, avatarUrl, skills, hourlyRate, location, website, companyName, companyDescription } = body;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Update role-specific data
    if (profile?.role === 'freelancer') {
      const { error: freelancerError } = await supabase
        .from('freelancers')
        .update({
          bio,
          title,
          skills: skills || [],
          hourly_rate: hourlyRate,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', session.user.id);

      if (freelancerError) {
        console.error('Freelancer update error:', freelancerError);
        return NextResponse.json({ error: 'Failed to update freelancer profile' }, { status: 500 });
      }
    } else if (profile?.role === 'client') {
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          company_name: companyName,
          company_description: companyDescription,
          location,
          website,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', session.user.id);

      if (clientError) {
        console.error('Client update error:', clientError);
        return NextResponse.json({ error: 'Failed to update client profile' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get role-specific data
    let roleData = null;
    if (profile.role === 'freelancer') {
      const { data } = await supabase
        .from('freelancers')
        .select('*')
        .eq('profile_id', session.user.id)
        .single();
      roleData = data;
    } else if (profile.role === 'client') {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', session.user.id)
        .single();
      roleData = data;
    }

    return NextResponse.json({
      ...profile,
      ...roleData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
