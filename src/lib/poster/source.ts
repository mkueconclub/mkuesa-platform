import { siteConfig } from "@/config/site";
import {
  eventFacts,
  opportunityEyebrow,
  opportunityFacts,
  posterCta,
  type EventPosterInput,
  type OpportunityPosterInput,
  type PosterKind,
} from "@/lib/poster/layout";
import type { PosterData } from "@/lib/poster/poster";
import { createClient } from "@/lib/supabase/server";

type Signer = PosterData["signer"];

type AnnouncementRow = { id: string; title: string; body: string; status: string; published_at: string | null; created_at: string };
type EventRow = EventPosterInput & { id: string; title: string; slug: string; description: string; status: string; created_at: string };
type OpportunityRow = OpportunityPosterInput & { id: string; title: string; description: string; status: string; created_at: string };

/**
 * Reads one announcement, event or opportunity and turns it into poster content.
 * Row Level Security still decides which rows the signed-in officer can read; a row they cannot read returns null (404).
 */
export async function loadPosterData(kind: PosterKind, id: string, signer: Signer): Promise<PosterData | null> {
  const supabase = await createClient();
  const host = new URL(siteConfig.url).host;
  const signedAt = new Date().toISOString();

  if (kind === "announcement") {
    const { data } = await supabase.from("announcements").select("id, title, body, status, published_at, created_at").eq("id", id).maybeSingle();
    const row = data as AnnouncementRow | null;
    if (!row) return null;
    const published = row.status === "published";
    return {
      id: row.id,
      kind,
      title: row.title,
      body: row.body,
      issuedAt: (published && row.published_at) || row.created_at,
      published,
      signer,
      signedAt,
      eyebrow: "OFFICIAL ANNOUNCEMENT",
      facts: [],
      cta: posterCta(kind, host),
    };
  }

  if (kind === "event") {
    const { data } = await supabase
      .from("events")
      .select("id, title, slug, description, location, starts_at, ends_at, registration_required, registration_deadline, status, created_at")
      .eq("id", id)
      .maybeSingle();
    const row = data as EventRow | null;
    if (!row) return null;
    return {
      id: row.id,
      kind,
      title: row.title,
      body: row.description,
      issuedAt: row.created_at,
      published: row.status === "published",
      signer,
      signedAt,
      eyebrow: new Date(row.starts_at).getTime() >= Date.now() ? "UPCOMING EVENT" : "MKUESA EVENT",
      facts: eventFacts(row),
      cta: posterCta(kind, host, row.slug, row.registration_required),
    };
  }

  const { data } = await supabase
    .from("opportunities")
    .select("id, title, description, organisation, category, location, deadline, status, created_at")
    .eq("id", id)
    .maybeSingle();
  const row = data as OpportunityRow | null;
  if (!row) return null;
  return {
    id: row.id,
    kind,
    title: row.title,
    body: row.description,
    issuedAt: row.created_at,
    published: row.status === "published",
    signer,
    signedAt,
    eyebrow: opportunityEyebrow(row.category),
    facts: opportunityFacts(row),
    cta: posterCta(kind, host),
  };
}
