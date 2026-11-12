import { AdminNav } from "@/components/admin/admin-nav";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { logoutAction } from "@/lib/auth/actions";
import { adminNavFor } from "@/lib/auth/permissions";
import { roleLabels, staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

// Server-side gate for every page under /admin. Non-staff are sent back to their dashboard.
// Pages re-check their own access, and the database enforces permissions on every query (Row Level Security).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(staffRoles, "/admin");
  return (
    <PublicShell>
      <div className="bg-ivory">
        <Container className="grid gap-8 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-14">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <p className="hidden text-sm text-muted lg:block">
              Signed in as<br />
              <span className="font-medium text-ink">{profile.full_name}</span><br />
              <span className="text-xs">{roleLabels[profile.role]}</span>
            </p>
            <AdminNav items={adminNavFor(profile.role)} />
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <Button href="/dashboard" variant="accent" className="lg:w-full">Member portal</Button>
              <form action={logoutAction}><Button type="submit" variant="outline" className="lg:w-full">Sign out</Button></form>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </Container>
      </div>
    </PublicShell>
  );
}
