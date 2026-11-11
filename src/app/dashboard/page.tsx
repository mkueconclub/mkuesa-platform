import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { currentAcademicYear } from "@/config/association";
import { requireProfile } from "@/lib/auth/session";
import { currentMembership, eventHasEnded, getMemberships, membershipStatusText } from "@/lib/member/queries";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

type RegWithEvent = { status: string; event: { id: string; title: string; starts_at: string; ends_at: string | null } | null };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const profile = await requireProfile("/dashboard");
  const supabase = await createClient();

  const [memberships, regs, anns, certs] = await Promise.all([
    getMemberships(profile.id),
    supabase
      .from("event_registrations")
      .select("status, event:events(id, title, starts_at, ends_at)")
      .eq("profile_id", profile.id)
      .neq("status", "cancelled"),
    supabase
      .from("announcements")
      .select("id, title, published_at, is_pinned")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(3),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
  ]);

  const membership = currentMembership(memberships);
  const registrations = ((regs.data ?? []) as unknown as RegWithEvent[]).filter((r) => r.event);
  const upcoming = registrations
    .filter((r) => r.event && !eventHasEnded(r.event))
    .sort((a, b) => a.event!.starts_at.localeCompare(b.event!.starts_at));
  const attended = registrations.filter((r) => r.status === "attended").length;
  const announcements = anns.data ?? [];

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title={`Welcome, ${profile.full_name.split(" ")[0]}`} />
      <div className="space-y-6">
        {denied && <Notice>You do not have access to that area.</Notice>}

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-2xl text-brand-900">Membership {currentAcademicYear}</h2>
            {membership && <Badge tone={membership.status === "approved" ? "brand" : "neutral"}>{membership.status}</Badge>}
          </div>
          {membership ? (
            <div className="mt-3 space-y-1">
              <p>{membershipStatusText[membership.status]}</p>
              {membership.membership_number && <p className="text-muted">Membership number: {membership.membership_number}</p>}
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <p className="text-muted">You have not applied for this academic year yet.</p>
              <Button href="/dashboard/membership">Apply for membership</Button>
            </div>
          )}
        </Card>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card><p className="text-sm text-muted">Upcoming events</p><p className="font-display text-4xl text-brand-900">{upcoming.length}</p></Card>
          <Card><p className="text-sm text-muted">Events attended</p><p className="font-display text-4xl text-brand-900">{attended}</p></Card>
          <Card><p className="text-sm text-muted">Certificates</p><p className="font-display text-4xl text-brand-900">{certs.count ?? 0}</p></Card>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl text-brand-900">Your upcoming events</h2>
            <Link href="/dashboard/events" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">All events <ArrowRight aria-hidden className="size-4" /></Link>
          </div>
          {upcoming.length ? (
            <ul className="mt-4 divide-y divide-brand-100">
              {upcoming.slice(0, 3).map((r) => (
                <li key={r.event!.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{r.event!.title}</p>
                    <p className="text-sm text-muted">{formatEventDate(r.event!.starts_at)}</p>
                  </div>
                  <Badge tone={r.status === "waitlisted" ? "accent" : "brand"}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted">You are not registered for any upcoming event.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl text-brand-900">Latest announcements</h2>
            <Link href="/dashboard/announcements" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">All announcements <ArrowRight aria-hidden className="size-4" /></Link>
          </div>
          {announcements.length ? (
            <ul className="mt-4 divide-y divide-brand-100">
              {announcements.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="font-medium">{a.title}</p>
                  {a.published_at && <p className="text-sm text-muted">{formatEventDate(a.published_at)}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted">No announcements have been published yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
