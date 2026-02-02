// app/api/clients/update/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    // Try to get the session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', { hasSession: !!session, sessionError });
    
    if (sessionError || !session) {
      console.error('No session found:', sessionError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const authUser = session.user;

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'client') {
      return NextResponse.json(
        { error: 'Unauthorized - not a client' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      company_name, 
      location, 
      website, 
      company_description,
      logo_url 
    } = body;

    // Check if client record exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', authUser.id)
      .single();

    if (existingClient) {
      // Update existing client
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...(company_name !== undefined && { company_name }),
          ...(location !== undefined && { location }),
          ...(website !== undefined && { website }),
          ...(company_description !== undefined && { company_description }),
        })
        .eq('profile_id', authUser.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also update profile_completed flag
      await supabase
        .from('profiles')
        .update({ profile_completed: true })
        .eq('id', authUser.id);

      return NextResponse.json({ 
        success: true,
        client: data 
      });
    } else {
      // Create new client record
      const { data, error } = await supabase
        .from('clients')
        .insert({
          profile_id: authUser.id,
          company_name,
          location,
          website,
          company_description,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also update profile_completed flag
      await supabase
        .from('profiles')
        .update({ profile_completed: true })
        .eq('id', authUser.id);

      return NextResponse.json({ 
        success: true,
        client: data 
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update client profile';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
