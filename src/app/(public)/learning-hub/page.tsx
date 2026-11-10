import type { Metadata } from "next";
import { ContentCard } from "@/components/public/content-card";
import { PageHeader } from "@/components/public/page-header";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { resourceCategories, sampleResources } from "@/config/sample-content";

export const metadata: Metadata = { title: "Learning Hub" };

export default function LearningHubPage() {
  return (
    <>
      <PageHeader eyebrow="Learning Hub" title="Economics Learning Hub" description="Resources for economics, finance and investment, alongside academic materials, courses and video lessons." />
      <Section tone="paper">
        <Notice>Sample resources shown to demonstrate the layout. No links are active yet.</Notice>
      </Section>
      {resourceCategories.map((cat, i) => {
        const items = sampleResources.filter((r) => r.category === cat.id);
        return (
          <Section key={cat.id} id={cat.id} tone={i % 2 === 0 ? "ivory" : "paper"} title={cat.label}>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <li key={r.slug}><ContentCard title={r.title} summary={r.summary} sample /></li>
              ))}
            </ul>
          </Section>
        );
      })}
    </>
  );
}
