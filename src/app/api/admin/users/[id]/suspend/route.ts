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
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    // Update user status to suspended
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        account_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason || 'Admin suspension'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error suspending user:', updateError);
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: 'suspend_user',
      target_type: 'user',
      target_id: id,
      details: { reason: reason || 'Admin suspension' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
