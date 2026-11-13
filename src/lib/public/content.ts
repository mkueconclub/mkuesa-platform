import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { OpportunityCategory, ResourceCategory } from "@/config/taxonomy";

/**
 * Reads published, public content for the public website. It uses the visitor ("anon") connection, so the
 * database's Row Level Security decides what is visible: published items marked public, nothing else.
 * When the database is not connected (for example a fresh local checkout) the lists are simply empty.
 */
export type Result<T> = { ok: boolean; items: T[] };

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  registration_required: boolean;
};
export type PublicAnnouncement = { id: string; title: string; body: string; published_at: string | null; is_pinned: boolean };
export type PublicResource = { id: string; title: string; description: string | null; category: ResourceCategory; kind: string; external_url: string | null };
export type PublicOpportunity = {
  id: string;
  title: string;
  organisation: string | null;
  category: OpportunityCategory;
  description: string;
  apply_url: string | null;
  location: string | null;
  deadline: string | null;
};

type Db = ReturnType<typeof createPublicClient>;
type Query = PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>;

async function list<T>(label: string, run: (db: Db) => Query): Promise<Result<T>> {
  if (!isSupabaseConfigured()) return { ok: true, items: [] };
  try {
    const { data, error } = await run(createPublicClient());
    if (error) {
      console.error(`public ${label} failed:`, error.code, error.message);
      return { ok: false, items: [] };
    }
    return { ok: true, items: (data ?? []) as T[] };
  } catch (e) {
    console.error(`public ${label} threw:`, e);
    return { ok: false, items: [] };
  }
}

export const getEvents = () =>
  list<PublicEvent>("events", (db) =>
    db.from("events").select("id, slug, title, description, location, starts_at, ends_at, capacity, registration_required").eq("status", "published").order("starts_at", { ascending: true }).limit(200),
  );

export async function getEventBySlug(slug: string): Promise<PublicEvent | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const r = await list<PublicEvent>("event", (db) =>
    db.from("events").select("id, slug, title, description, location, starts_at, ends_at, capacity, registration_required").eq("status", "published").eq("slug", slug).limit(1),
  );
  return r.items[0] ?? null;
}

export const getAnnouncements = (limit = 6) =>
  list<PublicAnnouncement>("announcements", (db) =>
    db.from("announcements").select("id, title, body, published_at, is_pinned").eq("status", "published").order("is_pinned", { ascending: false }).order("published_at", { ascending: false }).limit(limit),
  );

export const getResources = (limit = 200) =>
  list<PublicResource>("resources", (db) =>
    db.from("resources").select("id, title, description, category, kind, external_url").eq("status", "published").order("created_at", { ascending: false }).limit(limit),
  );

export const getOpportunities = () =>
  list<PublicOpportunity>("opportunities", (db) =>
    db.from("opportunities").select("id, title, organisation, category, description, apply_url, location, deadline").eq("status", "published").order("deadline", { ascending: true, nullsFirst: false }).limit(200),
  );
