import type { Metadata } from "next";
import { ContentCard } from "@/components/public/content-card";
import { ExternalLink } from "@/components/public/external-link";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { resourceCategories } from "@/config/taxonomy";
import { getResources } from "@/lib/public/content";
import { excerpt } from "@/lib/public/filters";

export const metadata: Metadata = { title: "Learning Hub", description: "Learning resources for economics, finance and investment." };
export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = { link: "Web resource", video: "Video", file: "Document" };

export default async function LearningHubPage() {
  const { ok, items } = await getResources();
  const groups = resourceCategories.map((c) => ({ ...c, items: items.filter((r) => r.category === c.id) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader eyebrow="Learning Hub" title="Economics Learning Hub" description="Resources for economics, finance and investment, alongside academic materials, courses and video lessons." />
      {!ok ? (
        <Section tone="paper"><Notice tone="pending" title="Resources are temporarily unavailable">Please try again shortly.</Notice></Section>
      ) : groups.length === 0 ? (
        <Section tone="paper"><p className="max-w-2xl text-lg text-muted">No public resources have been published yet. Approved members can find further learning material in the member portal.</p></Section>
      ) : (
        groups.map((g, i) => (
          <Section key={g.id} id={g.id} tone={i % 2 === 0 ? "paper" : "ivory"} title={g.label}>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {g.items.map((r) => (
                <li key={r.id}>
                  <ContentCard label={kindLabel[r.kind] ?? "Resource"} title={r.title} summary={excerpt(r.description, 180)}>
                    <ExternalLink href={r.external_url}>Open resource</ExternalLink>
                  </ContentCard>
                </li>
              ))}
            </ul>
          </Section>
        ))
      )}
      <Section tone="ivory" eyebrow="For members" title="Member resources">
        <p className="max-w-2xl text-lg">Further learning material is reserved for approved members and is available in the member portal.</p>
        <div className="mt-6"><Button href="/dashboard/resources" variant="outline">Open member resources</Button></div>
      </Section>
    </>
  );
}
