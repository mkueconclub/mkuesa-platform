"use client";

import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "@/lib/supabase/cookies";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Supabase client for the browser. Used only to know who is signed in (for the status bar) and to keep the
 * session fresh while a page is open. The library stores the session in a long-lived cookie and renews the
 * short-lived access token automatically, so people stay signed in across visits until they sign out.
 * Security does not depend on this client: the server and the database check every request themselves.
 */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key, { cookieOptions: authCookieOptions });
}
