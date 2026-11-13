import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ContentCard } from "@/components/public/content-card";
import { PageHeader } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { opportunityCategories, sampleOpportunities } from "@/config/sample-content";
import { alumniOpportunityCategories } from "@/lib/validation/alumni";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Opportunities" };
export const dynamic = "force-dynamic"; // approved opportunities appear as soon as they are published

type Opp = { id: string; title: string; category: string; organisation: string | null; description: string; eligibility: string | null; deadline: string | null; apply_url: string | null; contact: string | null };
const label = (id: string) => alumniOpportunityCategories.find((c) => c.value === id)?.label ?? opportunityCategories.find((c) => c.id === id)?.label ?? id.replace(/_/g, " ");

export default async function OpportunitiesPage() {
  const live = isSupabaseConfigured();
  let opps: Opp[] = [];
  let failed = false;
  if (live) {
    const { data, error } = await createPublicClient()
      .from("opportunities")
      .select("id, title, category, organisation, description, eligibility, deadline, apply_url, contact")
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${new Date().toISOString()}`)
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(200);
    if (error) { console.error("public opportunities failed:", error.code, error.message); failed = true; } else opps = (data ?? []) as Opp[];
  }
  const groups = [...new Set(opps.map((o) => o.category))];

  return (
    <>
      <PageHeader eyebrow="Opportunities" title="Opportunities" description="Attachments, internships, scholarships, graduate trainee programmes, mentorship, research collaboration and careers, shared by the association and MKU alumni." />
      {!live ? (
        <>
          <Section tone="paper"><Notice>Sample listings shown to demonstrate the layout. Real opportunities appear here once Supabase is connected.</Notice></Section>
          {opportunityCategories.map((c, i) => (
            <Section key={c.id} id={c.id} tone={i % 2 === 0 ? "ivory" : "paper"} title={c.label}>
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sampleOpportunities.filter((o) => o.category === c.id).map((o) => <li key={o.slug}><ContentCard label={c.label} title={o.title} summary={o.summary} sample /></li>)}
              </ul>
            </Section>
          ))}
        </>
      ) : failed ? (
        <Section><Notice>Opportunities could not be loaded right now. Please try again shortly.</Notice></Section>
      ) : groups.length === 0 ? (
        <Section><p className="text-lg text-muted">No open opportunities at the moment. Please check back soon.</p></Section>
      ) : (
        groups.map((g, i) => (
          <Section key={g} id={g} tone={i % 2 === 0 ? "ivory" : "paper"} title={label(g)}>
            <ul className="grid gap-6 md:grid-cols-2">
              {opps.filter((o) => o.category === g).map((o) => (
                <li key={o.id}>
                  <Card className="flex h-full flex-col gap-3">
                    <h3 className="text-2xl text-brand-900">{o.title}</h3>
                    {o.organisation && <p className="font-medium text-brand-700">{o.organisation}</p>}
                    <p className="whitespace-pre-line text-muted">{o.description}</p>
                    <dl className="mt-auto space-y-1 text-sm">
                      {o.eligibility && <div><dt className="inline font-semibold">Eligibility: </dt><dd className="inline">{o.eligibility}</dd></div>}
                      {o.deadline && <div><dt className="inline font-semibold">Deadline: </dt><dd className="inline">{formatDay(o.deadline)}</dd></div>}
                      {o.contact && <div><dt className="inline font-semibold">Contact: </dt><dd className="inline">{o.contact}</dd></div>}
                    </dl>
                    {o.apply_url && (
                      <a href={o.apply_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 pt-1 font-semibold text-brand-700 hover:underline">
                        Apply <ArrowUpRight aria-hidden className="size-4" />
                      </a>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        ))
      )}
    </>
  );
}
