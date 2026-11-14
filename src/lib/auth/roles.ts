/**
 * Roles and role groups. MUST mirror the SQL in supabase/migrations
 * (tests/roles.test.ts fails if they drift). Authorisation is enforced by the
 * database; these lists only drive what the UI shows.
 */
export const userRoles = [
  "super_admin",
  "chairperson",
  "vice_chairperson",
  "secretary",
  "treasurer",
  "membership_coordinator",
  "content_editor",
  "member",
] as const;
export type UserRole = (typeof userRoles)[number];

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Administrator",
  chairperson: "Chairperson",
  vice_chairperson: "Vice Chairperson",
  secretary: "Secretary",
  treasurer: "Treasurer",
  membership_coordinator: "Membership Coordinator",
  content_editor: "Content Editor",
  member: "General Member",
};

export const roleBadgeLabels: Record<UserRole, string> = {
  super_admin: "Master Admin",
  chairperson: "Chairperson",
  vice_chairperson: "Vice Chairperson",
  secretary: "Secretary",
  treasurer: "Treasurer",
  membership_coordinator: "Membership Coordinator",
  content_editor: "Content Editor",
  member: "Member",
};
export const staffRoles: readonly UserRole[] = userRoles.filter((r) => r !== "member");
export const leadershipRoles: readonly UserRole[] = ["super_admin", "chairperson", "vice_chairperson", "secretary"];
export const memberReaderRoles: readonly UserRole[] = [...leadershipRoles, "membership_coordinator"];
export const memberApproverRoles: readonly UserRole[] = ["super_admin", "chairperson", "treasurer", "membership_coordinator"];

export const isUserRole = (v: unknown): v is UserRole => typeof v === "string" && (userRoles as readonly string[]).includes(v);
