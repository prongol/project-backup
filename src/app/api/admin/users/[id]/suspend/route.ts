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
    const { reason, duration_days = 30 } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 });
    }

    // Validate duration (20-30 days recommended, max 90)
    const validDuration = Math.min(Math.max(duration_days, 1), 90);
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + validDuration);

    // Update user status to suspended with expiration
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        account_status: 'suspended',
        suspension_reason: reason,
        suspended_until: suspendedUntil.toISOString(),
        suspended_by: user.id
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error suspending user:', updateError);
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
    }

    // Notify the suspended user
    await supabase
      .from('notifications')
      .insert({
        user_id: id,
        title: '⚠️ Account Suspended',
        message: `Your account has been suspended for ${validDuration} days. Reason: ${reason}`,
        type: 'account_alert',
        link: '/dashboard'
      });

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: 'suspended_account',
      action_details: {
        target_user_id: id,
        reason,
        duration_days: validDuration,
        suspended_until: suspendedUntil.toISOString()
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `User suspended for ${validDuration} days until ${suspendedUntil.toLocaleDateString()}`,
      suspended_until: suspendedUntil.toISOString()
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
