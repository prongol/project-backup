import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
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

    // Update user status to active
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        account_status: 'active',
        suspended_at: null,
        suspension_reason: null
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error activating user:', updateError);
      return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: 'activate_user',
      target_type: 'user',
      target_id: id,
      details: { reason: 'Admin activation' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
