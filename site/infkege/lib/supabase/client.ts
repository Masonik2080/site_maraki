// lib/supabase/client.ts
// Browser-side Supabase client (singleton)
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return client;
}
