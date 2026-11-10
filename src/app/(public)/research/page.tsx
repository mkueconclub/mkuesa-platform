import type { Metadata } from "next";
import { ContentCard } from "@/components/public/content-card";
import { PageHeader } from "@/components/public/page-header";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { publicationTypes, samplePublications } from "@/config/sample-content";

export const metadata: Metadata = { title: "Research and Publications" };

export default function ResearchPage() {
  return (
    <>
      <PageHeader eyebrow="Research" title="Research and Publications" description="Student research, articles, economic analysis and association publications." />
      <Section tone="paper">
        <Notice>Sample publications shown to demonstrate the layout.</Notice>
      </Section>
      {publicationTypes.map((t, i) => (
        <Section key={t.id} tone={i % 2 === 0 ? "ivory" : "paper"} title={t.label}>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {samplePublications.filter((p) => p.type === t.id).map((p) => (
              <li key={p.slug}><ContentCard label={t.label} title={p.title} summary={p.summary} sample /></li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
