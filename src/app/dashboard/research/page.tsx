import type { Metadata } from "next";
import Link from "next/link";
import { ResearchForm, WithdrawResearchButton } from "@/components/dashboard/member-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireProfile } from "@/lib/auth/session";
import { getMemberships, hasActiveMembership } from "@/lib/member/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "My research", robots: { index: false, follow: false } };

type Row = { id: string; title: string; slug: string; status: "draft" | "submitted" | "in_review" | "published" | "rejected"; created_at: string; published_at: string | null };

const statusText: Record<Row["status"], string> = {
  draft: "Draft",
  submitted: "Waiting for review",
  in_review: "Being reviewed",
  published: "Published",
  rejected: "Not accepted",
};

export default async function MyResearchPage() {
  const profile = await requireProfile("/dashboard/research");
  const supabase = await createClient();
  const [mine, memberships] = await Promise.all([
    // Authors can read their own rows (Row Level Security), whatever the status.
    supabase.from("research_publications").select("id, title, slug, status, created_at, published_at").eq("author_id", profile.id).order("created_at", { ascending: false }),
    getMemberships(profile.id),
  ]);
  const rows = (mine.data ?? []) as Row[];
  const active = hasActiveMembership(memberships);

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="My research" description="Submit your own research, an essay or an economic analysis. The committee reviews it before anything is published." />
      <div className="space-y-8">
        {active ? (
          <Card>
            <h2 className="mb-4 text-2xl text-brand-900">Submit new work</h2>
            <ResearchForm defaultAuthor={profile.full_name} />
          </Card>
        ) : (
          <Notice tone="pending" title="Approved members only">
            Research submissions open once your membership is approved. <Link href="/dashboard/membership" className="font-medium underline">Check your membership status</Link>.
          </Notice>
        )}

        <section aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="mb-4 text-2xl text-brand-900">Your submissions</h2>
          {rows.length ? (
            <ul className="space-y-4">
              {rows.map((r) => (
                <li key={r.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg text-brand-900">{r.status === "published" ? <Link href={`/research/${r.slug}`} className="hover:underline">{r.title}</Link> : r.title}</h3>
                      <p className="text-sm text-muted">Submitted {formatDay(r.created_at)}{r.published_at ? ` · published ${formatDay(r.published_at)}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={r.status === "published" ? "brand" : "neutral"}>{statusText[r.status]}</Badge>
                      {r.status === "submitted" && <WithdrawResearchButton id={r.id} />}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card><p className="text-muted">You have not submitted anything yet.</p></Card>
          )}
          <p className="mt-4 text-sm text-muted">You can keep up to 5 submissions waiting for review at once. A submission can be withdrawn until review begins.</p>
        </section>
      </div>
    </>
  );
}
