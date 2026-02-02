import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/monitoring/[id] - Update monitoring issue
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const {
      status,
      resolution_notes,
      risk_level,
      admin_assigned
    } = body;

    const updateData: any = {
      last_updated: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (resolution_notes) updateData.resolution_notes = resolution_notes;
    if (risk_level) updateData.risk_level = risk_level;
    if (admin_assigned) updateData.admin_assigned = admin_assigned;

    const { data: issue, error } = await supabase
      .from('contract_monitoring')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating monitoring issue:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        monitoring_id: id,
        contract_id: issue.contract_id,
        admin_id: user.id,
        action_type: 'updated_issue',
        action_details: body,
        outcome: 'completed'
      });

    return NextResponse.json({ issue });
  } catch (error: any) {
    console.error('Error in monitoring PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
