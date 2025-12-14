// lib/supabase/index.ts
// Re-export all Supabase clients
export { getSupabaseBrowserClient } from './client';
export { getSupabaseServerClient, getSupabaseAdminClient } from './server';
export { createSupabaseMiddlewareClient } from './middleware';
