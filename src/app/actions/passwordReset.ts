'use server';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/serverClient';

export async function createPasswordResetToken(email: string) {
  try {
    // First verify the user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return { success: false, error: 'Failed to verify user' };
    }

    const targetUser = user.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!targetUser) {
      // For security, don't reveal if email exists
      return { success: true, message: 'If the email exists, a reset link will be sent' };
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Set expiration (1 hour for security)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Delete any existing tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', targetUser.id);
    
    // Store new token in Supabase using admin client
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: targetUser.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });
    
    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return { success: false, error: tokenError.message };
    }
    
    // Get user's full name from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', targetUser.id)
      .single();
    
    return { 
      success: true, 
      token,
      email: targetUser.email,
      name: profile?.full_name || 'User'
    };
  } catch (error: any) {
    console.error('Error creating password reset token:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyPasswordResetToken(token: string) {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find the token in the database
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();
    
    if (tokenError || !resetToken) {
      return { success: false, error: 'Invalid or expired reset token' };
    }
    
    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('id', resetToken.id);
      
      return { success: false, error: 'Reset token has expired' };
    }
    
    return { 
      success: true, 
      userId: resetToken.user_id 
    };
  } catch (error: any) {
    console.error('Error verifying reset token:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePasswordResetToken(token: string) {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Delete the token
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('token_hash', tokenHash);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting reset token:', error);
    return { success: false, error: error.message };
  }
}
