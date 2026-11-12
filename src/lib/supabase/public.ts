import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * A client for public pages. It never reads or writes cookies, so a visitor is always "anon" and sees
 * only what Row Level Security shows to everyone. Use createClient() from ./server for signed-in pages.
 */
export function createPublicClient() {
  const { url, key } = getSupabaseEnv();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
