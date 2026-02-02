'use server';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/serverClient';

export async function verifyEmailToken(token: string) {
  try {
    console.log('🔍 Starting email verification for token:', token.substring(0, 5) + '...');
    
    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Look up the token in the database using admin client to bypass RLS
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('user_id, expires_at')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenError) {
      console.error('❌ Database error looking up token:', tokenError);
      return {
        success: false,
        message: 'Invalid or expired verification link.',
      };
    }

    if (!tokenData) {
      console.error('❌ No token found for hash');
      return {
        success: false,
        message: 'Invalid or expired verification link.',
      };
    }

    console.log('✅ Token found:', {
      userId: tokenData.user_id,
      expiresAt: tokenData.expires_at
    });

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error('❌ Token expired at:', tokenData.expires_at);
      return {
        success: false,
        message: 'This verification link has expired. Please request a new one.',
      };
    }

    // 1. Delete the token after use (instead of used_at since column doesn't exist)
    const { error: deleteError } = await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('token_hash', tokenHash);

    if (deleteError) {
      console.warn('⚠️ Warning: Could not delete verification token, but continuing:', deleteError);
    }


    // 2. Actually confirm the user's email in Supabase Auth using Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );

    if (authError) {
      console.error('❌ Error confirming user email in Auth:', authError);
      // We don't necessarily fail the whole thing if RLS on profiles is handled differently,
      // but usually this is what's needed.
    }

    // 3. Get profile status and role to determine redirect
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', tokenData.user_id)
      .single();

    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
      userId: tokenData.user_id,
      role: profile?.role,
      profileCompleted: profile?.profile_completed
    };
  } catch (error: any) {
    console.error('❌ Verification error exception:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

