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
        <Container className="grid gap-6 py-6 sm:py-10 lg:gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-14">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <p className="hidden text-sm text-muted lg:block">
              Signed in as<br />
              <span className="font-medium text-ink">{profile.full_name}</span><br />
              <span className="text-xs">{roleLabels[profile.role]}</span>
            </p>
            <AdminNav items={adminNavFor(profile.role)} />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 [&>*:only-child]:col-span-2 lg:[&>*:only-child]:col-span-1">
              <Button href="/dashboard" variant="accent" className="w-full">Member portal</Button>
              <form action={logoutAction}><Button type="submit" variant="outline" className="w-full">Sign out</Button></form>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </Container>
      </div>
    </PublicShell>
  );
}
