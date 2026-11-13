import type { UserRole } from "@/lib/auth/roles";
import { currentAcademicYear } from "@/config/association";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRow, MembershipStatus } from "@/types/database";

const MEMBERSHIP_COLUMNS = "status, academic_year, membership_number, rejection_reason, expires_at, applied_at";

/** All of this person's membership rows, newest first. Row Level Security limits the result to their own. */
export async function getMemberships(profileId: string): Promise<MembershipRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("profile_id", profileId)
    .order("academic_year", { ascending: false });
  return (data ?? []) as MembershipRow[];
}

export const currentMembership = (rows: MembershipRow[]): MembershipRow | null =>
  rows.find((m) => m.academic_year === currentAcademicYear) ?? null;

/**
 * Mirrors private.is_approved_member() in the database: approved and not past its expiry date.
 * Used only to decide what to explain in the interface. The database enforces access on every query.
 */
export function hasActiveMembership(
  rows: MembershipRow[],
  today = new Date(),
  role?: UserRole,
): boolean {
  if (role === "super_admin") return true;

  const day = today.toISOString().slice(0, 10);

  return rows.some(
    (m) =>
      m.status === "approved" &&
      (m.expires_at === null || m.expires_at >= day),
  );
}

export const membershipStatusText: Record<MembershipStatus, string> = {
  pending: "Your application is awaiting review by the membership team.",
  approved: "Your membership is active.",
  rejected: "Your application was not approved.",
  suspended: "Your membership is suspended. Please contact the association.",
  expired: "Your membership has expired.",
};

/** The same window the database uses in can_register_for_event(), for showing or hiding the Register button. */
export function registrationOpen(
  e: { registration_required: boolean; registration_deadline: string | null; starts_at: string; ends_at: string | null },
  now = new Date(),
): boolean {
  if (!e.registration_required) return false;
  if (e.registration_deadline && new Date(e.registration_deadline) < now) return false;
  return new Date(e.ends_at ?? e.starts_at) > now;
}

export const eventHasEnded = (e: { starts_at: string; ends_at: string | null }, now = new Date()): boolean =>
  new Date(e.ends_at ?? e.starts_at) <= now;
