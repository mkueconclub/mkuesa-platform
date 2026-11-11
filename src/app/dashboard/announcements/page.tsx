import type { Metadata } from "next";
import { Pin } from "lucide-react";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";
import type { AnnouncementRow } from "@/types/database";

export const metadata: Metadata = { title: "Announcements", robots: { index: false, follow: false } };

export default async function AnnouncementsPage() {
  await requireProfile("/dashboard/announcements");
  const supabase = await createClient();
  // Row Level Security already limits this to published items this person may see (members-only items need an approved membership).
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, visibility, is_pinned, published_at")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as AnnouncementRow[];

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="Announcements" description="News and updates from the association." />
      {items.length ? (
        <ul className="space-y-6">
          {items.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  {a.is_pinned && <Badge tone="accent"><Pin aria-hidden className="mr-1 size-3" />Pinned</Badge>}
                  {a.visibility === "members" && <Badge tone="brand">Members only</Badge>}
                </div>
                <h2 className="mt-2 text-2xl text-brand-900">{a.title}</h2>
                {a.published_at && <p className="text-sm text-muted">{formatEventDate(a.published_at)}</p>}
                {/* Plain text on purpose: never rendered as HTML. */}
                <p className="mt-4 whitespace-pre-line break-words">{a.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card><p className="text-muted">No announcements have been published yet.</p></Card>
      )}
    </>
  );
}
