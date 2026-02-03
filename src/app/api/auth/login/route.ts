// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { signInSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { trackSession, logActivity } from '@/lib/sessionTracking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = signInSchema.parse(body);

    const data = await signIn(validatedData.email, validatedData.password);

    // Track session and log activity on successful login
    if (data.user) {
      try {
        // Track the new session as current
        await trackSession(data.user.id, true);
        
        // Log successful login activity
        await logActivity(
          data.user.id,
          'Successful login',
          'auth',
          'success'
        );
      } catch (trackingError) {
        // Don't fail the login if tracking fails, just log it
        console.error('Error tracking session/activity:', trackingError);
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    // Log failed login attempt if we have user info
    try {
      const body = await request.clone().json();
      if (body.email) {
        // Try to find user by email to log failed attempt
        // This is optional - only log if you want to track failed attempts
        await logActivity(
          'unknown', // We don't have user ID for failed logins
          'Failed login attempt',
          'auth',
          'failed'
        );
      }
    } catch (logError) {
      // Ignore logging errors
      console.error('Error logging failed login:', logError);
    }
    
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}