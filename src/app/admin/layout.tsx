import { PublicShell } from "@/components/layout/public-shell";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

// Server-side gate for every page under /admin. Non-staff are sent back to their dashboard.
// The database still enforces permissions on every query (Row Level Security).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(staffRoles, "/admin");
  return <PublicShell>{children}</PublicShell>;
}
