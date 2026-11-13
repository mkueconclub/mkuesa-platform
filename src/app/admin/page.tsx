import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/page-title";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { currentAcademicYear } from "@/config/association";
import { can } from "@/lib/auth/permissions";
import { roleLabels, type UserRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Executive workspace", robots: { index: false, follow: false } };

const STATUSES = ["pending", "approved", "rejected", "suspended", "expired"] as const;
type StatItem = { label: string; value: number | null; href?: string; note?: string };
type ActionItem = { title: string; description: string; href: string; tag?: string };

const roleCopy: Record<UserRole, { greeting: string; focus: string; actions: ActionItem[] }> = {
  super_admin: { greeting: "Your command centre", focus: "Governance, platform health and the full association picture.", actions: [
    { title: "Review membership", description: "Applications, member records and role assignments.", href: "/admin/members/applications", tag: "Governance" },
    { title: "Executive committee", description: "Maintain officer records and committee appointments.", href: "/admin/committee", tag: "Leadership" },
    { title: "Audit trail", description: "Review administrative activity and accountability.", href: "/admin/audit", tag: "Oversight" },
  ] },
  chairperson: { greeting: "The president’s desk", focus: "Lead the agenda, keep programmes moving and maintain a clear view of the association.", actions: [
    { title: "Leadership overview", description: "Review activity, registrations and association performance.", href: "/admin/analytics", tag: "Strategy" },
    { title: "Approve the agenda", description: "Oversee events, announcements and member-facing priorities.", href: "/admin/events", tag: "Programmes" },
    { title: "Review alumni network", description: "Keep alumni opportunities and submissions on track.", href: "/admin/alumni", tag: "Network" },
  ] },
  vice_chairperson: { greeting: "Your programmes desk", focus: "Coordinate delivery across programmes, content and the executive team.", actions: [
    { title: "Coordinate events", description: "Track upcoming programmes and event registrations.", href: "/admin/events", tag: "Delivery" },
    { title: "Review publications", description: "Support research, resources and opportunities content.", href: "/admin/research", tag: "Knowledge" },
    { title: "Executive inbox", description: "Respond to messages routed to your officer account.", href: "/admin/executive-inbox", tag: "Correspondence" },
  ] },
  secretary: { greeting: "The secretariat", focus: "Keep records accurate, communications timely and the association informed.", actions: [
    { title: "Manage correspondence", description: "Review incoming contact messages and follow-ups.", href: "/admin/messages", tag: "Priority" },
    { title: "Publish announcements", description: "Prepare official notices and association updates.", href: "/admin/announcements", tag: "Communications" },
    { title: "Maintain committee records", description: "Keep executive positions and officer details current.", href: "/admin/committee", tag: "Records" },
  ] },
  treasurer: { greeting: "Your stewardship desk", focus: "A focused workspace for responsible oversight and your assigned association duties.", actions: [
    { title: "Review certificates", description: "View certificates issued to members and participants.", href: "/admin/certificates", tag: "Records" },
    { title: "View association updates", description: "Stay aligned with published announcements and programmes.", href: "/admin/announcements", tag: "Updates" },
    { title: "Your officer profile", description: "Keep your public executive profile up to date.", href: "/admin/executive-profile", tag: "Your office" },
  ] },
  membership_coordinator: { greeting: "The membership desk", focus: "Welcome new members, process applications and keep the member community thriving.", actions: [
    { title: "Application queue", description: "Review pending membership applications and decisions.", href: "/admin/members/applications", tag: "Priority" },
    { title: "Member directory", description: "Find and review current member records.", href: "/admin/members", tag: "Community" },
    { title: "Membership insights", description: "Track membership activity and current-year status.", href: "/admin/analytics", tag: "Insights" },
  ] },
  content_editor: { greeting: "The editorial studio", focus: "Create useful content, support learning and keep the MKUESA knowledge hub fresh.", actions: [
    { title: "Create an announcement", description: "Draft a timely update for the student community.", href: "/admin/announcements", tag: "Editorial" },
    { title: "Curate resources", description: "Organise learning materials and useful opportunities.", href: "/admin/resources", tag: "Learning" },
    { title: "Publish research", description: "Prepare research and publication content for review.", href: "/admin/research", tag: "Knowledge" },
  ] },
  member: { greeting: "Welcome", focus: "Your member workspace.", actions: [] },
};

function Stat({ item }: { item: StatItem }) {
  if (item.value === null) return null;
  const content = <Card className="h-full border-white/70 bg-white/95 p-5 shadow-sm"><p className="text-sm font-medium text-muted">{item.label}</p><p className="mt-2 font-display text-4xl tracking-tight text-brand-950">{item.value.toLocaleString()}</p>{item.note && <p className="mt-1 text-xs text-muted">{item.note}</p>}</Card>;
  return item.href ? <Link href={item.href} className="block rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand-700">{content}</Link> : content;
}

function ActionCard({ item, index }: { item: ActionItem; index: number }) {
  return <Link href={item.href} className="group flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-950/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700">
    <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 font-display text-lg text-brand-800">0{index + 1}</span>{item.tag && <span className="rounded-full bg-accent-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-800">{item.tag}</span>}</div>
    <h3 className="mt-5 text-xl text-brand-950">{item.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.description}</p>
    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-800">Open workspace <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></span>
  </Link>;
}

export default async function AdminPage() {
  const profile = await requireProfile("/admin");
  const role = profile.role;
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const nowIso = new Date().toISOString();
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
  const byStatus = mem ? Object.fromEntries(STATUSES.map((s, i) => [s, mem[i].count ?? 0])) as Record<(typeof STATUSES)[number], number> : null;
  const totalApps = byStatus ? Object.values(byStatus).reduce((a, b) => a + b, 0) : 0;
  const copy = roleCopy[role];

  const statsByRole: Partial<Record<UserRole, StatItem[]>> = {
    super_admin: [ { label: "Registered accounts", value: profiles?.count ?? null, href: "/admin/members" }, { label: "Pending applications", value: byStatus?.pending ?? null, href: "/admin/members/applications", note: currentAcademicYear }, { label: "Upcoming events", value: events.count ?? 0, href: "/admin/events" }, { label: "New messages", value: msgs?.count ?? null, href: "/admin/messages" } ],
    chairperson: [ { label: "Registered members", value: profiles?.count ?? null, href: "/admin/members" }, { label: "Upcoming events", value: events.count ?? 0, href: "/admin/events" }, { label: "Event registrations", value: regs?.count ?? null }, { label: "New messages", value: msgs?.count ?? null, href: "/admin/messages" } ],
    vice_chairperson: [ { label: "Upcoming programmes", value: events.count ?? 0, href: "/admin/events" }, { label: "Event registrations", value: regs?.count ?? null }, { label: "Published updates", value: anns.count ?? 0, href: "/admin/announcements" } ],
    secretary: [ { label: "New correspondence", value: msgs?.count ?? null, href: "/admin/messages" }, { label: "Published notices", value: anns.count ?? 0, href: "/admin/announcements" }, { label: "Upcoming events", value: events.count ?? 0, href: "/admin/events" } ],
    treasurer: [ { label: "Certificates in force", value: certs?.count ?? null, href: "/admin/certificates" }, { label: "Published updates", value: anns.count ?? 0, href: "/admin/announcements" }, { label: "Upcoming events", value: events.count ?? 0, href: "/admin/events" } ],
    membership_coordinator: [ { label: "Registered accounts", value: profiles?.count ?? null, href: "/admin/members" }, { label: "Pending applications", value: byStatus?.pending ?? null, href: "/admin/members/applications", note: currentAcademicYear }, { label: "Approved this year", value: byStatus?.approved ?? null, note: currentAcademicYear } ],
    content_editor: [ { label: "Published announcements", value: anns.count ?? 0, href: "/admin/announcements" }, { label: "Upcoming events", value: events.count ?? 0, href: "/admin/events" } ],
  };
  const stats = statsByRole[role] ?? [];

  return <>
    <PageTitle eyebrow={`${roleLabels[role]} · Executive portal`} title="Your workspace" description={`${profile.full_name} · ${currentAcademicYear}`} />
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-900 to-[#4b1267] px-6 py-8 text-white shadow-xl shadow-brand-950/10 sm:px-9 sm:py-10">
        <div aria-hidden className="absolute -right-16 -top-24 size-72 rounded-full border-[1px] border-white/10" /><div aria-hidden className="absolute -right-2 -top-10 size-52 rounded-full border border-white/10" /><div aria-hidden className="absolute -bottom-24 right-1/4 size-48 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-200">MKUESA · Office of {roleLabels[role]}</p><h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{copy.greeting}, {profile.full_name.split(" ")[0]}.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">{copy.focus}</p><div className="mt-7 flex flex-wrap gap-3">{can.useExecutiveProfile(role) && <Link href="/admin/executive-profile" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-950 transition hover:bg-accent-100">View officer profile</Link>}{can.useExecutiveProfile(role) && <Link href="/admin/executive-inbox" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Open my inbox <span aria-hidden>→</span></Link>}</div></div>
      </section>

      {stats.length > 0 && <section aria-label="Office snapshot"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">At a glance</p><h2 className="mt-1 text-2xl text-brand-950">Office snapshot</h2></div><span className="text-xs text-muted">Live platform records</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <Stat key={item.label} item={item} />)}</div></section>}

      <section><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Your responsibilities</p><h2 className="mt-1 text-2xl text-brand-950">Workspaces for your office</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A curated set of tools based on your executive responsibilities and access level.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{copy.actions.map((item, index) => <ActionCard key={item.href} item={item} index={index} />)}</div></section>

      {byStatus && (role === "membership_coordinator" || role === "chairperson" || role === "super_admin") && <Card className="border-brand-100 bg-white"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Membership pipeline</p><h2 className="mt-1 text-2xl text-brand-950">Applications · {currentAcademicYear}</h2></div><Link href="/admin/members/applications" className="text-sm font-semibold text-brand-800 hover:underline">Open application queue →</Link></div>{totalApps ? <ul className="mt-6 space-y-4">{STATUSES.map((status) => <li key={status} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm"><span className="capitalize text-muted">{status}</span><span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-brand-50"><span className="block h-full rounded-full bg-gradient-to-r from-brand-700 to-accent-500" style={{ width: `${(byStatus[status] / totalApps) * 100}%` }} /></span><span className="text-right font-semibold tabular-nums text-brand-950">{byStatus[status]}</span></li>)}</ul> : <p className="mt-5 text-sm text-muted">No membership applications have been recorded for this academic year yet.</p>}</Card>}

      {role === "treasurer" && <Notice tone="pending">Financial reporting and budget tools are not currently part of the platform. This workspace only displays records your account is authorised to access; no financial figures are fabricated.</Notice>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 pt-5 text-sm text-muted"><span>MKUESA Executive Portal · Access tailored to your office</span><Link href="/dashboard" className="font-semibold text-brand-800 hover:underline">Return to member portal →</Link></div>
    </div>
  </>;
}
