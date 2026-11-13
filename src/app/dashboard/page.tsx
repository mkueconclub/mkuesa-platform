import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Award, BookOpen, CalendarDays, CheckCircle2, Clock3, Compass, FileText, Megaphone, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { currentAcademicYear } from "@/config/association";
import { redirect } from "next/navigation";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";
import { currentMembership, eventHasEnded, getMemberships, membershipStatusText } from "@/lib/member/queries";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

type RegWithEvent = { status: string; event: { id: string; title: string; starts_at: string; ends_at: string | null } | null };

const shortcuts = [
  { href: "/dashboard/events", label: "Explore events", detail: "Find your next opportunity", icon: CalendarDays },
  { href: "/dashboard/resources", label: "Learning library", detail: "Resources to move you forward", icon: BookOpen },
  { href: "/dashboard/research", label: "Research hub", detail: "Develop and share ideas", icon: FileText },
  { href: "/dashboard/certificates", label: "My certificates", detail: "Your achievements in one place", icon: Award },
];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const profile = await requireProfile("/dashboard");
  if ((await getAlumniProfile(profile.id))?.status === "approved" && !denied) redirect("/alumni");
  const supabase = await createClient();
  const [memberships, regs, anns, certs] = await Promise.all([
    getMemberships(profile.id),
    supabase.from("event_registrations").select("status, event:events(id, title, starts_at, ends_at)").eq("profile_id", profile.id).neq("status", "cancelled"),
    supabase.from("announcements").select("id, title, published_at, is_pinned").order("is_pinned", { ascending: false }).order("published_at", { ascending: false }).limit(3),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
  ]);

  const membership = currentMembership(memberships);
  const registrations = ((regs.data ?? []) as unknown as RegWithEvent[]).filter((r) => r.event);
  const upcoming = registrations.filter((r) => r.event && !eventHasEnded(r.event)).sort((a, b) => a.event!.starts_at.localeCompare(b.event!.starts_at));
  const attended = registrations.filter((r) => r.status === "attended").length;
  const announcements = anns.data ?? [];
  const firstName = profile.full_name.split(" ")[0];
  const membershipApproved = membership?.status === "approved";

  return (
    <div className="space-y-8">
      {denied && <Notice>You do not have access to that area.</Notice>}
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-brand-950 px-6 py-8 text-white shadow-xl shadow-brand-950/10 sm:px-9 sm:py-10">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_5%,rgba(171,79,210,.42),transparent_42%),radial-gradient(ellipse_at_0%_100%,rgba(226,103,22,.22),transparent_40%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(110deg,black,transparent_75%)]" />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/85"><Sparkles className="size-3.5 text-accent-200" /> YOUR MEMBER SPACE</div>
            <p className="text-sm font-medium text-white/65">Good to have you here</p>
            <h1 className="mt-1 text-4xl leading-tight text-white sm:text-5xl">Hello, {firstName}<span className="text-accent-300">.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/70 sm:text-base">Your ideas, opportunities and community — all in one place. Make this your space to learn, connect and grow.</p>
          </div>
          <div className="min-w-[190px] rounded-2xl border border-white/15 bg-white/[.08] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/55">Academic year</p>
            <p className="mt-1 font-display text-3xl text-white">{currentAcademicYear}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-white/75"><span className={`size-2 rounded-full ${membershipApproved ? "bg-emerald-400" : "bg-accent-300"}`} />{membershipApproved ? "Membership active" : membership?.status ?? "Membership pending"}</div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/events" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-400 px-5 py-2.5 text-sm font-bold text-brand-950 transition hover:bg-accent-300">Explore opportunities <ArrowUpRight className="size-4" /></Link>
          <Link href="/dashboard/profile" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">View my profile</Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={CalendarDays} label="Upcoming events" value={upcoming.length} note="Your next experiences" />
        <Metric icon={CheckCircle2} label="Events attended" value={attended} note="Experiences completed" />
        <Metric icon={Award} label="Certificates" value={certs.count ?? 0} note="Achievements earned" />
      </div>

      <section aria-labelledby="shortcuts-heading">
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent-700">Make your move</p><h2 id="shortcuts-heading" className="mt-1 text-2xl text-brand-950 sm:text-3xl">Your spaces</h2></div><span className="hidden text-sm text-muted sm:block">Everything you need to get involved</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-950/5"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><Icon className="size-5" /></span><span className="mt-4 flex items-center justify-between gap-2 font-semibold text-brand-950">{label}<ArrowUpRight className="size-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" /></span><span className="mt-1 block text-sm text-muted">{detail}</span></Link>)}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="overflow-hidden !p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 px-5 py-5 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent-700">Stay involved</p><h2 className="mt-1 text-2xl text-brand-950">Your upcoming events</h2></div><Link href="/dashboard/events" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">All events <ArrowUpRight className="size-4" /></Link></div>
          {upcoming.length ? <ul className="divide-y divide-brand-100">{upcoming.slice(0, 4).map((r) => <li key={r.event!.id} className="flex items-center gap-4 px-5 py-4 sm:px-6"><div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-800"><CalendarDays className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-brand-950">{r.event!.title}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><Clock3 className="size-3.5" />{formatEventDate(r.event!.starts_at)}</p></div><Badge tone={r.status === "waitlisted" ? "accent" : "brand"}>{r.status === "waitlisted" ? "Waitlisted" : r.status}</Badge></li>)}</ul> : <div className="px-6 py-10 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Compass className="size-5" /></span><p className="mt-3 font-semibold text-brand-950">Your next experience awaits</p><p className="mt-1 text-sm text-muted">Browse upcoming events and find something that inspires you.</p><Link href="/dashboard/events" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Discover events <ArrowUpRight className="size-4" /></Link></div>}
        </Card>

        <Card className="overflow-hidden !p-0">
          <div className="border-b border-brand-100 px-5 py-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-accent-700">The latest</p><h2 className="mt-1 text-2xl text-brand-950">From MKUESA</h2></div>
          {announcements.length ? <ul className="divide-y divide-brand-100">{announcements.map((a) => <li key={a.id} className="px-5 py-4 sm:px-6"><div className="flex items-start gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700"><Megaphone className="size-4" /></span><div className="min-w-0"><p className="font-semibold leading-snug text-brand-950">{a.title}</p>{a.published_at && <p className="mt-1 text-xs text-muted">{formatEventDate(a.published_at)}</p>}</div></div></li>)}</ul> : <div className="px-6 py-10 text-center"><p className="font-semibold text-brand-950">Nothing new just yet</p><p className="mt-1 text-sm text-muted">Association updates will appear here.</p></div>}
          <div className="border-t border-brand-100 px-5 py-4 sm:px-6"><Link href="/dashboard/announcements" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Read all updates <ArrowUpRight className="size-4" /></Link></div>
        </Card>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><CheckCircle2 className="size-5" /></span><div><h2 className="font-semibold text-brand-950">Membership · {currentAcademicYear}</h2><p className="mt-1 text-sm text-muted">{membership ? membershipStatusText[membership.status] : "You have not applied for this academic year yet."}{membership?.membership_number ? ` Membership number: ${membership.membership_number}.` : ""}</p></div></div>
        <div className="mt-4 shrink-0 sm:mt-0">{membership ? <Link href="/dashboard/membership" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">View membership <ArrowUpRight className="size-4" /></Link> : <Link href="/dashboard/membership" className="inline-flex min-h-10 items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Apply for membership</Link>}</div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: number; note: string }) {
  return <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted">{label}</p><span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-4" /></span></div><p className="mt-3 font-display text-4xl leading-none text-brand-950">{value}</p><p className="mt-2 text-xs text-muted">{note}</p></div>;
}
