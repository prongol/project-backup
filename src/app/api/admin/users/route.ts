import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters for search and filter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';

    // Build query
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, account_status, trust_score, is_admin')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('account_status', status);
    }
    
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    // Apply search
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify super admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin || profile.admin_level !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, full_name, role, admin_level } = body;

    // Create admin user via Supabase Auth
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Update profile with additional info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        role,
        is_admin: true,
        admin_level: admin_level || 'support',
        account_status: 'active',
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newUser.user });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
