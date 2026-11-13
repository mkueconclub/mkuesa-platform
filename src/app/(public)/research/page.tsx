import type { Metadata } from "next";
import { ContentCard } from "@/components/public/content-card";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { publicationTypes } from "@/config/taxonomy";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Research and Publications" };
export const dynamic = "force-dynamic"; // reads the live list of published work

type Pub = { slug: string; title: string; type: string; author_name: string | null; abstract: string | null; published_at: string | null };

const excerpt = (text: string | null, max = 200) => {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max).replace(/\s+\S*$/, "")}…` : t;
};

export default async function ResearchPage() {
  // Shows published work only. When the database is not connected (for example a fresh local checkout) the list is simply empty.
  const live = isSupabaseConfigured();
  let pubs: Pub[] = [];
  let failed = false;
  if (live) {
    const { data, error } = await createPublicClient()
      .from("research_publications")
      .select("slug, title, type, author_name, abstract, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("public research list failed:", error.code, error.message);
      failed = true;
    } else {
      pubs = (data ?? []) as Pub[];
    }
  }

  return (
    <>
      <PageHeader eyebrow="Research" title="Research and Publications" description="Student research, articles, economic analysis and association publications.">
        <Button href="/dashboard/research" variant="accent">Submit your research</Button>
      </PageHeader>

      {failed ? (
        <Section tone="paper"><Notice tone="pending" title="Publications are not available right now">Please try again later.</Notice></Section>
      ) : pubs.length === 0 ? (
        <Section tone="paper">
          <Notice tone="pending" title="No publications yet">Publications appear here once they have been reviewed and approved by the committee. Approved members can submit research from the member portal.</Notice>
        </Section>
      ) : (
        publicationTypes.map((t, i) => {
          const items = pubs.filter((p) => p.type === t.id);
          if (!items.length) return null;
          return (
            <Section key={t.id} tone={i % 2 === 0 ? "ivory" : "paper"} title={t.label}>
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <li key={p.slug}>
                    <ContentCard label={t.label} title={p.title} summary={excerpt(p.abstract) || "Read the full text."} href={`/research/${p.slug}`}>
                      <p className="mt-auto text-sm text-muted">{[p.author_name, p.published_at ? formatDay(p.published_at) : null].filter(Boolean).join(" · ")}</p>
                    </ContentCard>
                  </li>
                ))}
              </ul>
            </Section>
          );
        })
      )}
    </>
  );
}
