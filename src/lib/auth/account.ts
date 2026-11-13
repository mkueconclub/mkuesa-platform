import "server-only";
import { staffRoles, isUserRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type HeaderAccount = { firstName: string; dashboardHref: string; dashboardLabel: string; adminHref: string | null };

/** What the site header shows for the signed-in person, or null for visitors. Never throws: a visitor view is the safe fallback. */
export async function getHeaderAccount(): Promise<HeaderAccount | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const supabase = await createClient();
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
      supabase.from("alumni_profiles").select("status").eq("id", user.id).maybeSingle(),
    ]);
    if (!p) return null;
    const alumnus = a?.status === "approved";
    return {
      firstName: String(p.full_name ?? "").split(" ")[0] || "Account",
      dashboardHref: alumnus ? "/alumni" : "/dashboard",
      dashboardLabel: alumnus ? "Alumni portal" : "Dashboard",
      adminHref: isUserRole(p.role) && staffRoles.includes(p.role) ? "/admin" : null,
    };
  } catch {
    return null;
  }
}
