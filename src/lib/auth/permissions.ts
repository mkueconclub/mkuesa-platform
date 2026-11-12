import { leadershipRoles, memberApproverRoles, memberReaderRoles, staffRoles, type UserRole } from "@/lib/auth/roles";

/**
 * What each role may do in the admin portal. MUST mirror the policies in
 * supabase/migrations/*_rls_and_privileges.sql (tests/admin.test.ts checks the content matrix).
 * The database enforces these rules on every query; this file only decides what the interface shows.
 */
export type ContentKind = "announcements" | "events" | "resources" | "research" | "opportunities" | "committee";

export const contentTable: Record<ContentKind, string> = {
  announcements: "announcements",
  events: "events",
  resources: "resources",
  research: "research_publications",
  opportunities: "opportunities",
  committee: "executive_positions",
};

type Matrix = { full: readonly UserRole[]; cru: readonly UserRole[]; draft: readonly UserRole[] };

/** Same shape and values as the `cfg` JSON in the RLS migration. */
export const contentMatrix: Record<Exclude<ContentKind, "committee">, Matrix> = {
  announcements: { full: ["super_admin", "chairperson", "vice_chairperson", "secretary"], cru: [], draft: ["content_editor"] },
  events: { full: ["super_admin", "chairperson", "vice_chairperson", "secretary"], cru: ["content_editor"], draft: [] },
  resources: { full: ["super_admin", "chairperson", "content_editor"], cru: ["vice_chairperson", "secretary"], draft: [] },
  research: { full: ["super_admin", "chairperson", "content_editor"], cru: ["vice_chairperson", "secretary"], draft: [] },
  opportunities: { full: ["super_admin", "chairperson", "content_editor"], cru: ["vice_chairperson", "secretary"], draft: [] },
};

const committeeWriters: readonly UserRole[] = ["super_admin", "chairperson", "secretary"];

export type ContentPermissions = { read: boolean; write: boolean; delete: boolean; draftOnly: boolean };

export function contentPermissions(kind: ContentKind, role: UserRole): ContentPermissions {
  const read = staffRoles.includes(role); // every staff role can read content lists
  if (kind === "committee") {
    return { read, write: committeeWriters.includes(role), delete: role === "super_admin", draftOnly: false };
  }
  const m = contentMatrix[kind];
  const full = m.full.includes(role);
  const cru = m.cru.includes(role);
  const draft = m.draft.includes(role);
  return { read, write: full || cru || draft, delete: full, draftOnly: draft && !full && !cru };
}

export const can = {
  readMembers: (r: UserRole) => memberReaderRoles.includes(r),
  reviewApplications: (r: UserRole) => memberApproverRoles.includes(r),
  changeRoles: (r: UserRole) => r === "super_admin",
  issueCertificates: (r: UserRole) => memberReaderRoles.includes(r),
  revokeCertificates: (r: UserRole) => r === "super_admin" || r === "chairperson",
  readCertificates: (r: UserRole) => staffRoles.includes(r) && r !== "content_editor",
  seeRegistrations: (r: UserRole) => leadershipRoles.includes(r),
  readAudit: (r: UserRole) => leadershipRoles.includes(r),
  readMessages: (r: UserRole) => leadershipRoles.includes(r),
  updateMessages: (r: UserRole) => r === "super_admin" || r === "secretary",
};

export type AdminNavItem = { href: string; label: string };

/** Sidebar entries for a role. Pages and the database still check access themselves. */
export function adminNavFor(role: UserRole): AdminNavItem[] {
  const items: AdminNavItem[] = [{ href: "/admin", label: "Overview" }];
  if (can.readMembers(role)) items.push({ href: "/admin/members", label: "Members" }, { href: "/admin/members/applications", label: "Applications" });
  items.push(
    { href: "/admin/events", label: "Events" },
    { href: "/admin/announcements", label: "Announcements" },
    { href: "/admin/resources", label: "Resources" },
    { href: "/admin/research", label: "Publications" },
    { href: "/admin/opportunities", label: "Opportunities" },
  );
  if (can.readCertificates(role)) items.push({ href: "/admin/certificates", label: "Certificates" });
  items.push({ href: "/admin/committee", label: "Committee" });
  if (can.readMessages(role)) items.push({ href: "/admin/messages", label: "Messages" });
  if (can.readAudit(role)) items.push({ href: "/admin/audit", label: "Audit log" });
  return items;
}
