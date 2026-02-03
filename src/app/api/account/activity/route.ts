import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserActivities } from '@/lib/sessionTracking';

/**
 * GET /api/account/activity
 * Get recent activities for the current user
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
    
    const activities = await getUserActivities(user.id, 20);
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error in GET /api/account/activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
