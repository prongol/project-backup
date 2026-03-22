import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use the SSR browser client — no custom cookie handlers so it uses the
// built-in defaults which correctly set Path=/ on all session cookies,
// making them available to the middleware on every request.
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
