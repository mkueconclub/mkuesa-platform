import type { Metadata } from "next";
import { ArrowRight, Briefcase, Clock, Globe, HeartHandshake, Plus, UserRound, Users } from "lucide-react";
import { AButton, AlumniHero, Chip, Panel, ProgressRing, VerifiedBadge } from "@/components/alumni/ui";
import { getDirectory } from "@/lib/alumni/connect";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import { alumniOpportunityCategories, verifiedFollowerThreshold } from "@/lib/validation/alumni";

export const metadata: Metadata = { title: "Alumni dashboard", robots: { index: false, follow: false } };

type Sub = { id: string; title: string; category: string; submission_status: "pending" | "approved" | "rejected"; created_at: string };
const catLabel = (id: string) => alumniOpportunityCategories.find((c) => c.value === id)?.label ?? id;
const chip = { approved: ["live", "Live on site"], pending: ["review", "In review"], rejected: ["muted", "Not approved"] } as const;

export default async function AlumniDashboard() {
  const profile = await requireProfile("/alumni");
  const alumnus = await getAlumniProfile(profile.id);
  const { data } = alumnus
    ? await (await createClient()).from("opportunities").select("id, title, category, submission_status, created_at").not("submission_status", "is", null).order("created_at", { ascending: false }).limit(10)
    : { data: [] };
  const subs = (data ?? []) as Sub[];
  const first = profile.full_name.split(" ")[0];

  if (!alumnus) {
    return (
      <AlumniHero eyebrow="Alumni Network" title={`Welcome, ${first}`} description="Create your alumni profile to share opportunities and mentor MKU economics students. The committee verifies every profile.">
        <AButton href="/alumni/profile" variant="glow" size="lg">Create alumni profile <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" /></AButton>
      </AlumniHero>
    );
  }

  const approved = alumnus.status === "approved";
  const me = approved ? (await getDirectory()).find((p) => p.id === profile.id) : undefined;
  const followers = me?.follower_count ?? 0;
  const goal = verifiedFollowerThreshold + 1;
  const fields = [alumnus.graduation_year, alumnus.organisation, alumnus.position_title, alumnus.bio, alumnus.linkedin_url];
  const complete = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const live = subs.filter((s) => s.submission_status === "approved").length;
  const inReview = subs.filter((s) => s.submission_status === "pending").length;

  return (
    <div className="space-y-8">
      <AlumniHero
        eyebrow="Alumni Network"
        title={`Welcome back, ${first}`}
        description={approved ? "Open doors for the students who follow you: share an opportunity or offer mentorship." : alumnus.status === "pending" ? "Your profile is awaiting verification by the committee. You can post opportunities as soon as it is approved." : "Your profile was not approved. Update it and save to send it for review again."}
      >
        {approved ? (
          <>
            <AButton href="/alumni/opportunities" variant="glow" size="lg"><Plus aria-hidden className="size-5" /> Share an opportunity</AButton>
            <AButton href="/alumni/connect" variant="dark" size="lg"><Users aria-hidden className="size-5" /> Alumni Connect</AButton>
          </>
        ) : (
          <AButton href="/alumni/profile" variant="glow" size="lg">Review my profile</AButton>
        )}
        <Chip tone={approved ? "live" : alumnus.status === "pending" ? "review" : "muted"}>{approved ? "Verified alumnus" : alumnus.status === "pending" ? "Awaiting verification" : "Not approved"}</Chip>
      </AlumniHero>

      <ul className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Live on the site", value: live, icon: Globe },
          { label: "In review", value: inReview, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <li key={label} className="flex items-center justify-between rounded-3xl bg-paper p-6 ring-1 ring-brand-100">
            <div>
              <p className="tabular-nums font-display text-4xl text-brand-900">{value}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Icon aria-hidden className="size-6" /></span>
          </li>
        ))}
        <li className="flex items-center justify-between rounded-3xl bg-paper p-6 ring-1 ring-brand-100">
          <div>
            <p className="tabular-nums font-display text-4xl text-brand-900">{complete}%</p>
            <p className="mt-1 text-sm text-muted">Profile complete</p>
          </div>
          <ProgressRing value={complete} />
        </li>
      </ul>

      {approved && (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-brand-700"><Users aria-hidden className="size-5" /><h2 className="text-xl text-brand-900">Your followers</h2></div>
            {me?.is_verified && <VerifiedBadge />}
          </div>
          <p className="tabular-nums mt-4 font-display text-4xl text-brand-900">{followers}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-brand-100" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(followers, goal)} aria-label="Progress to the Verified badge">
            <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-700" style={{ width: `${Math.min(100, (followers / goal) * 100)}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted">{me?.is_verified ? "More than 50 approved members follow you. Your Verified badge shows beside your name." : `Approved members who follow you: ${followers} of ${goal} needed for the Verified badge (more than ${verifiedFollowerThreshold}).`}</p>
        </Panel>
      )}

      <div className="grid gap-8 xl:grid-cols-5">
        <Panel className="xl:col-span-2">
          <div className="flex items-center gap-3 text-brand-700"><UserRound aria-hidden className="size-5" /><h2 className="text-xl text-brand-900">Your profile</h2></div>
          <p className="mt-5 font-display text-2xl text-brand-900">{alumnus.position_title || "Add your position"}</p>
          <p className="text-muted">{alumnus.organisation || "Add your organisation"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>Class of {alumnus.graduation_year}</Chip>
            {alumnus.open_to_mentoring && <Chip tone="live">Open to mentoring</Chip>}
          </div>
          <AButton href="/alumni/profile" variant="soft" className="mt-6">Edit profile</AButton>
        </Panel>

        <Panel className="xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-brand-700"><Briefcase aria-hidden className="size-5" /><h2 className="text-xl text-brand-900">Your submissions</h2></div>
            {approved && <AButton href="/alumni/opportunities" variant="solid">New submission</AButton>}
          </div>
          {subs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-brand-200 p-8 text-center">
              <HeartHandshake aria-hidden className="mx-auto size-8 text-brand-400" />
              <p className="mt-3 text-muted">Nothing shared yet. Your first attachment, scholarship or mentorship offer could change a student&apos;s year.</p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-brand-100">
              {subs.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="text-sm text-muted">{catLabel(s.category)} · {formatDay(s.created_at)}</p>
                  </div>
                  <Chip tone={chip[s.submission_status][0]}>{chip[s.submission_status][1]}</Chip>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
