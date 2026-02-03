import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  status: string;
  actionType: string;
}

/**
 * Parse user agent to get device info
 */
export function parseUserAgent(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  
  let deviceType = os.name || 'Unknown';
  const browserName = browser.name || 'Unknown Browser';
  
  if (device.type === 'mobile') {
    deviceType = device.model || 'Mobile';
  } else if (device.type === 'tablet') {
    deviceType = device.model || 'Tablet';
  }
  
  return `${deviceType} - ${browserName}`;
}

/**
 * Get client IP address from headers
 */
export function getClientIP(headersList: Headers): string {
  // Check various headers that might contain the real IP
  const xForwardedFor = headersList.get('x-forwarded-for');
  const xRealIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (xRealIP) {
    return xRealIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'Unknown';
}

/**
 * Get location from IP (placeholder - integrate with IP geolocation service)
 */
export async function getLocationFromIP(ip: string): Promise<string> {
  // For now, return a default value
  // In production, integrate with a service like ipapi.co, ipinfo.io, or geoip-lite
  // Example: const response = await fetch(`https://ipapi.co/${ip}/json/`);
  
  if (ip === 'Unknown' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return 'Local Network';
  }
  
  // Default for now
  return 'Nepal'; // You can enhance this with actual geolocation
}

/**
 * Track user session
 */
export async function trackSession(userId: string, isCurrent: boolean = false): Promise<string | null> {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const userAgent = headersList.get('user-agent') || '';
    const ip = getClientIP(headersList);
    const device = parseUserAgent(userAgent);
    const location = await getLocationFromIP(ip);
    
    // Session expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // If marking as current, unmark all other sessions for this user
    if (isCurrent) {
      await supabase
        .from('user_sessions')
        .update({ is_current: false })
        .eq('user_id', userId);
    }
    
    // Use the upsert function
    const { data, error } = await supabase.rpc('upsert_user_session', {
      p_user_id: userId,
      p_device: device,
      p_location: location,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_expires_at: expiresAt.toISOString(),
      p_is_current: isCurrent
    });
    
    if (error) {
      console.error('Error tracking session:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in trackSession:', error);
    return null;
  }
}

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  action: string,
  actionType: 'security' | 'profile' | 'auth' | 'payment' | 'contract' | 'job' | 'message',
  status: 'success' | 'failed',
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const ip = getClientIP(headersList);
    const location = await getLocationFromIP(ip);
    
    // Use the log function
    const { data, error } = await supabase.rpc('log_user_activity', {
      p_user_id: userId,
      p_action: action,
      p_action_type: actionType,
      p_status: status,
      p_ip_address: ip,
      p_location: location,
      p_metadata: metadata || {}
    });
    
    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in logActivity:', error);
    return null;
  }
}

/**
 * Get user sessions
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('last_active', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
    
    return (data || []).map((session: any) => ({
      id: session.id,
      device: session.device,
      location: session.location || 'Unknown',
      lastActive: formatLastActive(session.last_active),
      current: session.is_current,
      ipAddress: session.ip_address
    }));
  } catch (error) {
    console.error('Error in getUserSessions:', error);
    return [];
  }
}

/**
 * Get user activities
 */
export async function getUserActivities(userId: string, limit: number = 10): Promise<ActivityLog[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
    
    return (data || []).map((activity: any) => ({
      id: activity.id,
      action: activity.action,
      timestamp: formatTimestamp(activity.created_at),
      ip: activity.ip_address,
      status: activity.status,
      actionType: activity.action_type
    }));
  } catch (error) {
    console.error('Error in getUserActivities:', error);
    return [];
  }
}

/**
 * Logout a specific session
 */
export async function logoutSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('logout_session', {
      p_session_id: sessionId,
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error logging out session:', error);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error('Error in logoutSession:', error);
    return false;
  }
}

/**
 * Logout all other sessions
 */
export async function logoutAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('logout_all_other_sessions', {
      p_user_id: userId,
      p_current_session_id: currentSessionId
    });
    
    if (error) {
      console.error('Error logging out other sessions:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Error in logoutAllOtherSessions:', error);
    return 0;
  }
}

/**
 * Format last active time
 */
function formatLastActive(lastActive: string): string {
  const now = new Date();
  const then = new Date(lastActive);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return then.toLocaleDateString();
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
