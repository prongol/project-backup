import crypto from 'crypto';
import { createClient } from '@/lib/supabase/client';

export async function POST(req:Request){
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) return new Response(JSON.stringify({error: "Token is required"}), {status:400});

    const supabase = createClient();
    const tokenHash = crypto.
    // Hash the received token
}
