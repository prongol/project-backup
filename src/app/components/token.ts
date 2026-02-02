// lib/verification.ts
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/serverClient'; // your server-side supabase client

export async function createVerificationToken(userId: number) {
  const supabase = supabaseAdmin;

  // 1. Generate a random token
  const token = crypto.randomBytes(32).toString('hex'); // 64 chars

  // 2. Hash the token before storing
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // 3. Set expiration (1 hour)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // 4. Store in Supabase
  const { error } = await supabase
    .from('email_verification_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (error) {
    console.error('Error storing verification token:', error);
    throw new Error('Could not create verification token');
    //no tables for this so error okay,
  }

  return token; // This is the plain token for the email link
}
