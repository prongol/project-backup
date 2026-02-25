import { NextResponse } from 'next/server';
import { verifyPasswordResetToken, deletePasswordResetToken } from '@/app/actions/passwordReset';
import { supabaseAdmin } from '@/lib/supabase/serverClient';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('🔑 Verifying password reset token...');

    // Verify the reset token
    const tokenVerification = await verifyPasswordResetToken(token);

    if (!tokenVerification.success || !tokenVerification.userId) {
      console.error('Token verification failed:', tokenVerification.error);
      return NextResponse.json(
        { error: tokenVerification.error || 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('✅ Token verified for user:', tokenVerification.userId);

    // Update the user's password using Supabase admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenVerification.userId,
      { password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('✅ Password updated successfully');

    // Delete the used token
    await deletePasswordResetToken(token);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}

