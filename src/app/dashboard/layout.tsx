import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { logoutAction } from "@/lib/auth/actions";
import { staffRoles } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";

// Layouts are not re-run on every navigation, so each page also calls requireProfile().
// This one makes sure nobody ever sees the portal chrome while signed out.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("/dashboard");
  return (
    <PublicShell>
      <div className="bg-ivory">
        <Container className="grid gap-8 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-14">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <p className="hidden text-sm text-muted lg:block">Signed in as<br /><span className="font-medium text-ink">{profile.full_name}</span></p>
            <DashboardNav />
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {staffRoles.includes(profile.role) && <Button href="/admin" variant="accent" className="lg:w-full">Administration</Button>}
              <form action={logoutAction}><Button type="submit" variant="outline" className="lg:w-full">Sign out</Button></form>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </Container>
      </div>
    </PublicShell>
  );
}
