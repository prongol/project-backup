import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  const supabase = createClient();

  // 1️⃣ Hash the token from the email
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // 2️⃣ Look up the hashed token in the DB
  const { data, error } = await supabase
    .from('email_verification_tokens')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash) // compare with hashed token in DB
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  // 3️⃣ Check expiration
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 400 });
  }

  // 4️⃣ Update user to verified
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_verified: true })
    .eq('id', data.user_id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
  }

  // 5️⃣ Delete token after use
  await supabase
    .from('email_verification_tokens')
    .delete()
    .eq('token_hash', tokenHash);

  // 6️⃣ Return success
  return NextResponse.json({ message: 'Account verified successfully' }, { status: 200 });
}
