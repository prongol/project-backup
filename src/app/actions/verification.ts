'use server';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/serverClient';

export async function createVerificationToken(userId: string) {
  try {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Set expiration (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Store in Supabase using admin client
    const { error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });
    
    if (tokenError) {
      console.error('Error storing verification token:', tokenError);
      return { success: false, error: tokenError.message };
    }
    
    return { success: true, token };
  } catch (error: any) {
    console.error('Error creating verification token:', error);
    return { success: false, error: error.message };
  }
}
