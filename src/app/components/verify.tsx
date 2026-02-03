import crypto from 'crypto';
import { createClient } from '@/lib/supabase/client';

export async function POST(req:Request){
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) return new Response(JSON.stringify({error: "Token is required"}), {status:400});

    const supabase = createClient();
    
    // Hash the received token using crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
