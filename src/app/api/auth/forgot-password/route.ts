import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/app/actions/passwordReset';
import { sendEmailAction } from '@/lib/emaila/emailActions';
import { resetPasswordEmail } from '@/utils/emailTemplates';
import { forgotPasswordSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📧 Forgot password request for:', body.email);
    
    // Validate request body
    const validatedData = forgotPasswordSchema.parse(body);

    // Create password reset token
    const tokenResult = await createPasswordResetToken(validatedData.email);

    if (!tokenResult.success) {
      console.error('Error creating reset token:', tokenResult.error);
      // Still return success for security (don't reveal if email exists)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // If user doesn't exist, tokenResult.success is true but no token
    if (!tokenResult.token) {
      // User doesn't exist, but we return success for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // Build reset URL with token
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${tokenResult.token}`;

    // Send password reset email using our custom email service
    try {
      const emailHtml = resetPasswordEmail(tokenResult.name, resetUrl);
      
      console.log('📧 Attempting to send password reset email to:', validatedData.email);
      
      const emailResult = await sendEmailAction({
        to: validatedData.email,
        subject: 'Reset Your Password - Neplancer',
        html: emailHtml
      });

      if (emailResult.success) {
        console.log('✅ Password reset email sent successfully to:', validatedData.email);
      } else {
        console.error('⚠️ Failed to send password reset email:', emailResult.error);
        return NextResponse.json(
          { error: 'Failed to send password reset email. Please try again later.' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('⚠️ Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Forgot password exception:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: 'Unable to process password reset request. Please try again later.' },
      { status: 500 }
    );
  }
}

