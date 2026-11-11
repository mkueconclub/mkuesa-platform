import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireProfile } from "@/lib/auth/session";
import { getMemberships, hasActiveMembership } from "@/lib/member/queries";
import { createClient } from "@/lib/supabase/server";
import type { ResourceCategory, ResourceRow } from "@/types/database";

export const metadata: Metadata = { title: "Resources", robots: { index: false, follow: false } };

const categoryLabels: Record<ResourceCategory, string> = {
  economics: "Economics",
  finance_investment: "Finance and investment",
  academic_material: "Academic materials",
  recommended_course: "Recommended courses",
  video_lesson: "Video lessons",
};
const categoryOrder = Object.keys(categoryLabels) as ResourceCategory[];

/** Only ever link to web addresses; the database also enforces this. */
const safeUrl = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

export default async function ResourcesPage() {
  const profile = await requireProfile("/dashboard/resources");
  const supabase = await createClient();
  const [resRes, memberships] = await Promise.all([
    supabase
      .from("resources")
      .select("id, title, description, category, kind, external_url, storage_path, tags, visibility")
      .eq("status", "published")
      .order("title", { ascending: true })
      .limit(300),
    getMemberships(profile.id),
  ]);
  const resources = (resRes.data ?? []) as ResourceRow[];
  const active = hasActiveMembership(memberships);

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="Resources" description="Learning materials for economics and finance students." />
      <div className="space-y-8">
        {!active && (
          <Notice tone="pending" title="Members-only resources">
            Some resources are only shown to approved members. They will appear here once your membership is approved.
          </Notice>
        )}
        {resources.length === 0 && <Card><p className="text-muted">No resources have been published yet.</p></Card>}
        {categoryOrder.map((cat) => {
          const items = resources.filter((r) => r.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2 id={`cat-${cat}`} className="mb-4 text-xl text-brand-900">{categoryLabels[cat]}</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {items.map((r) => {
                  const href = safeUrl(r.external_url);
                  return (
                    <li key={r.id}>
                      <Card className="h-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral" className="capitalize">{r.kind}</Badge>
                          {r.visibility === "members" && <Badge tone="brand">Members only</Badge>}
                        </div>
                        <h3 className="mt-2 text-lg text-brand-900">{r.title}</h3>
                        {r.description && <p className="mt-1 text-muted">{r.description}</p>}
                        <div className="mt-4">
                          {href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                              Open resource <ExternalLink aria-hidden className="size-4" />
                              <span className="sr-only">(opens in a new tab)</span>
                            </a>
                          ) : (
                            <p className="text-sm text-muted">File downloads will be available once file storage is set up.</p>
                          )}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
