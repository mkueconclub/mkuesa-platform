import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/ui/container";
import { publicationTypes } from "@/config/sample-content";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDay } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

type Pub = { slug: string; title: string; type: string; author_name: string | null; abstract: string | null; body: string | null; published_at: string | null };

async function load(slug: string): Promise<Pub | null> {
  if (!isSupabaseConfigured() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data } = await createPublicClient()
    .from("research_publications")
    .select("slug, title, type, author_name, abstract, body, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as Pub | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const pub = await load((await params).slug);
  return pub ? { title: pub.title, description: pub.abstract?.slice(0, 160) } : { title: "Research" };
}

export default async function PublicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const pub = await load((await params).slug);
  if (!pub) notFound();
  const label = publicationTypes.find((t) => t.id === pub.type)?.label ?? "Publication";

  return (
    <>
      <PageHeader eyebrow={label} title={pub.title} description={[pub.author_name, pub.published_at ? formatDay(pub.published_at) : null].filter(Boolean).join(" · ")} />
      <section className="bg-ivory py-16 sm:py-24">
        <Container>
          <article className="max-w-3xl space-y-8">
            {pub.abstract && (
              <div>
                <h2 className="mb-3 text-2xl text-brand-900">Abstract</h2>
                {/* Plain text on purpose: submitted by a member, so never rendered as HTML. */}
                <p className="whitespace-pre-line break-words text-lg leading-relaxed">{pub.abstract}</p>
              </div>
            )}
            {pub.body && (
              <div>
                <h2 className="mb-3 text-2xl text-brand-900">Full text</h2>
                <p className="whitespace-pre-line break-words leading-relaxed">{pub.body}</p>
              </div>
            )}
            <p><Link href="/research" className="font-medium text-brand-700 hover:underline">← All research and publications</Link></p>
          </article>
        </Container>
      </section>
    </>
  );
}
