import type { Metadata } from "next";
import { ContentCard } from "@/components/public/content-card";
import { PageHeader } from "@/components/public/page-header";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { opportunityCategories, sampleOpportunities } from "@/config/sample-content";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader eyebrow="Opportunities" title="Opportunities" description="Internships, scholarships, competitions, conferences and career opportunities for economics students." />
      <Section tone="paper">
        <Notice>Sample listings shown to demonstrate the layout. Real opportunities will be posted by the association.</Notice>
      </Section>
      {opportunityCategories.map((c, i) => (
        <Section key={c.id} id={c.id} tone={i % 2 === 0 ? "ivory" : "paper"} title={c.label}>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sampleOpportunities.filter((o) => o.category === c.id).map((o) => (
              <li key={o.slug}><ContentCard label={c.label} title={o.title} summary={o.summary} sample /></li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
