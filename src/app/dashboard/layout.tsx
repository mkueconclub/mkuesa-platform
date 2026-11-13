import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { logoutAction } from "@/lib/auth/actions";
import { staffRoles } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { ArrowUpRight, GraduationCap, ShieldCheck } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("/dashboard");
  const initials = profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <PublicShell>
      <div className="min-h-[75vh] bg-[linear-gradient(180deg,#faf8fc_0%,#f4f0e7_100%)]">
        <Container className="grid gap-6 py-6 sm:py-9 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 lg:py-10">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-2">
            <div className="hidden overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-lg shadow-brand-950/10 lg:block">
              <div className="flex items-center gap-3"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-display text-lg text-accent-200">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{profile.full_name}</p><p className="mt-0.5 text-xs capitalize text-white/55">{profile.role.replaceAll("_", " ")}</p></div></div>
              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/65"><ShieldCheck className="size-4 text-accent-300" /> Secure member portal</div>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-white p-2 shadow-sm lg:rounded-3xl lg:p-3">
              <div className="hidden px-3 pb-3 pt-2 lg:block"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-muted">Your workspace</p></div>
              <DashboardNav />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {staffRoles.includes(profile.role) && <Button href="/admin" variant="accent" className="w-full"><GraduationCap className="size-4" /> Administration <ArrowUpRight className="size-4" /></Button>}
              <form action={logoutAction} className={staffRoles.includes(profile.role) ? "" : "col-span-2 lg:col-span-1"}><Button type="submit" variant="outline" className="w-full">Sign out</Button></form>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </Container>
      </div>
    </PublicShell>
  );
}
