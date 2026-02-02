// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        profile_completed: profile.profile_completed,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile_completed, avatar_url } = body;

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(profile_completed !== undefined && { profile_completed }),
        ...(avatar_url !== undefined && { avatar_url }),
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      profile: data 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}