// app/api/auth/profile-completed/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabse/server';
import { sendEmail, getProfileCompletionEmail } from '@/lib/emailaa';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to get full name and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Send profile completion email
    try {
      const completionEmail = getProfileCompletionEmail(
        profile.full_name,
        profile.email,
        profile.role as 'client' | 'freelancer'
      );
      
      const result = await sendEmail(completionEmail);
      
      if (result.success) {
        console.log('✅ Profile completion email sent to:', profile.email);
        return NextResponse.json({
          success: true,
          message: 'Profile completion email sent successfully',
        });
      } else {
        console.error('❌ Failed to send profile completion email:', result.error);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('❌ Email sending exception:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in profile completion endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
