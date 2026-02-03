import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSessions, logoutSession, logoutAllOtherSessions } from '@/lib/sessionTracking';

/**
 * GET /api/account/sessions
 * Get all active sessions for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const sessions = await getUserSessions(user.id);
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error in GET /api/account/sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account/sessions/:id
 * Logout a specific session
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { sessionId, logoutAll } = body;
    
    if (logoutAll) {
      // Logout all other sessions
      const currentSession = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .single();
      
      if (!currentSession.data) {
        return NextResponse.json(
          { error: 'Current session not found' },
          { status: 404 }
        );
      }
      
      const count = await logoutAllOtherSessions(user.id, currentSession.data.id);
      
      return NextResponse.json({ 
        success: true,
        message: `Logged out ${count} session(s)`
      });
    } else if (sessionId) {
      // Logout a specific session
      const success = await logoutSession(sessionId, user.id);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to logout session' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Session logged out successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'sessionId or logoutAll is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/account/sessions:', error);
    return NextResponse.json(
      { error: 'Failed to logout session' },
      { status: 500 }
    );
  }
}
