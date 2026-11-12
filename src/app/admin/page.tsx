import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/page-title";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { currentAcademicYear } from "@/config/association";
import { can } from "@/lib/auth/permissions";
import { roleLabels } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

const STATUSES = ["pending", "approved", "rejected", "suspended", "expired"] as const;

function Stat({ label, value, href }: { label: string; value: number | null; href?: string }) {
  if (value === null) return null;
  const body = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-4xl text-brand-900">{value}</p>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export default async function AdminPage() {
  const profile = await requireProfile("/admin");
  const role = profile.role;
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const nowIso = new Date().toISOString();

  // Only ask for what this role is allowed to see; the database would hide the rest anyway.
  const readMembers = can.readMembers(role);
  const leadership = can.seeRegistrations(role);
  const [profiles, mem, events, anns, regs, certs, msgs] = await Promise.all([
    readMembers ? supabase.from("profiles").select("id", head) : null,
    readMembers ? Promise.all(STATUSES.map((s) => supabase.from("memberships").select("id", head).eq("academic_year", currentAcademicYear).eq("status", s))) : null,
    supabase.from("events").select("id", head).eq("status", "published").gte("starts_at", nowIso),
    supabase.from("announcements").select("id", head).eq("status", "published"),
    leadership ? supabase.from("event_registrations").select("id", head).in("status", ["registered", "attended"]) : null,
    can.readCertificates(role) ? supabase.from("certificates").select("id", head).is("revoked_at", null) : null,
    can.readMessages(role) ? supabase.from("contact_messages").select("id", head).eq("status", "new") : null,
  ]);

  const byStatus = mem ? Object.fromEntries(STATUSES.map((s, i) => [s, mem[i].count ?? 0])) : null;
  const totalApps = byStatus ? Object.values(byStatus).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <PageTitle eyebrow="Administration" title="Overview" description={`${profile.full_name} · ${roleLabels[role]}`} />
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Registered accounts" value={profiles ? (profiles.count ?? 0) : null} href="/admin/members" />
          <Stat label={`Pending applications (${currentAcademicYear})`} value={byStatus ? byStatus.pending : null} href="/admin/members/applications" />
          <Stat label={`Approved members (${currentAcademicYear})`} value={byStatus ? byStatus.approved : null} />
          <Stat label="Upcoming published events" value={events.count ?? 0} href="/admin/events" />
          <Stat label="Published announcements" value={anns.count ?? 0} href="/admin/announcements" />
          <Stat label="Event sign-ups" value={regs ? (regs.count ?? 0) : null} />
          <Stat label="Certificates in force" value={certs ? (certs.count ?? 0) : null} href="/admin/certificates" />
          <Stat label="New contact messages" value={msgs ? (msgs.count ?? 0) : null} href="/admin/messages" />
        </div>

        {byStatus && (
          <Card>
            <h2 className="text-2xl text-brand-900">Applications for {currentAcademicYear}</h2>
            {totalApps ? (
              <ul className="mt-4 space-y-3">
                {STATUSES.map((s) => (
                  <li key={s} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3 text-sm">
                    <span className="capitalize">{s}</span>
                    <span aria-hidden className="h-3 rounded-full bg-brand-50">
                      <span className="block h-3 rounded-full bg-brand-600" style={{ width: `${(byStatus[s] / totalApps) * 100}%` }} />
                    </span>
                    <span className="text-right font-medium">{byStatus[s]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-muted">No applications yet for this academic year.</p>
            )}
          </Card>
        )}

        {role === "treasurer" && <Notice tone="pending">Your role can view content and certificates. Financial tools are not part of this platform yet.</Notice>}
      </div>
    </>
  );
}
