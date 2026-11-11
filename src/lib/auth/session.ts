import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

/** The signed-in user, verified with the Auth server (never trust a cookie alone). */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Signed-in user plus their profile row. The role always comes from the database, never from the token. */
const loadProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, programme, year_of_study, role")
    .eq("id", userId)
    .maybeSingle();
  return data as ProfileRow | null;
});

export async function requireProfile(next = "/dashboard"): Promise<ProfileRow> {
  const user = await requireUser(next);
  const data = await loadProfile(user.id);
  if (!data || !isUserRole(data.role)) redirect("/login?error=profile");
  return data;
}

export async function requireRole(roles: readonly UserRole[], next = "/admin"): Promise<ProfileRow> {
  const profile = await requireProfile(next);
  if (!roles.includes(profile.role)) redirect("/dashboard?denied=1");
  return profile;
}
