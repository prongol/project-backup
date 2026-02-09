import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { notificationIds, userId, markAllAsRead } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: 'All notifications marked as read' 
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds)
      .eq('user_id', userId); // Security: ensure user owns these notifications

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications marked as read' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notification(s)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (deleteAll) {
      // Delete all read notifications for user
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: 'Read notifications deleted' 
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Delete specific notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId); // Security: ensure user owns this notification

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
