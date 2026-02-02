import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/monitoring - Get all monitoring issues
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const riskLevel = searchParams.get('risk_level');
    const issueType = searchParams.get('issue_type');

    let query = supabase
      .from('contract_monitoring')
      .select(`
        *,
        contract:contract_id(
          id,
          title,
          status,
          total_amount,
          created_at,
          client:client_id(full_name, email),
          freelancer:freelancer_id(full_name, email)
        ),
        admin:admin_assigned(full_name, email)
      `)
      .eq('status', status)
      .order('risk_score', { ascending: false });

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    if (issueType) {
      query = query.eq('issue_type', issueType);
    }

    const { data: issues, error } = await query;

    if (error) {
      console.error('Error fetching monitoring issues:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ issues });
  } catch (error: any) {
    console.error('Error in monitoring endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/monitoring - Create or update monitoring issue
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      contract_id,
      issue_type,
      risk_level,
      flags,
      risk_score,
      notes
    } = body;

    // Create monitoring issue
    const { data: issue, error } = await supabase
      .from('contract_monitoring')
      .insert({
        contract_id,
        issue_type,
        risk_level,
        flags,
        risk_score,
        admin_assigned: user.id,
        resolution_notes: notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating monitoring issue:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ issue });
  } catch (error: any) {
    console.error('Error in monitoring POST:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
