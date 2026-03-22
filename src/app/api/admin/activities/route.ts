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
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch contract activity logs
    const { data: contractActivities, error: contractError } = await supabase
      .from('contract_activity_log')
      .select(`
        id, activity_type, timestamp, user_role, details,
        contract:contracts!contract_activity_log_contract_id_fkey(title),
        performer:profiles!contract_activity_log_user_id_fkey(full_name)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit / 2);

    if (contractError) {
      console.error('Error fetching contract activities:', contractError);
    }

    // Fetch admin actions
    const { data: adminActions, error: adminError } = await supabase
      .from('admin_actions')
      .select(`
        id, action_type, timestamp, action_details, outcome, notes,
        admin:profiles!admin_actions_admin_id_fkey(full_name)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit / 2);

    if (adminError) {
      console.error('Error fetching admin actions:', adminError);
    }

    // Combine and sort activities
    const contractActivitiesFormatted = (contractActivities || []).map((a: any) => ({
      id: a.id,
      timestamp: a.timestamp,
      created_at: a.timestamp,
      action_taken: a.action,
      description: `${a.action} - ${a.contract?.title || 'Unknown contract'} by ${a.performer?.full_name || 'Unknown'}`,
      type: 'contract_activity'
    }));

    const adminActionsFormatted = (adminActions || []).map((a: any) => ({
      id: a.id,
      timestamp: a.created_at,
      created_at: a.created_at,
      action_taken: a.action_type,
      description: `Admin ${a.admin?.full_name || 'Unknown'} performed ${a.action_type.replace('_', ' ')}`,
      type: 'admin_action'
    }));

    const activities = [...contractActivitiesFormatted, ...adminActionsFormatted]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
