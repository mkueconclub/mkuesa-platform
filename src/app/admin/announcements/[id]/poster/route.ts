import { posterSignerRoles } from "@/lib/auth/permissions";
import { roleLabels } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { posterFileName } from "@/lib/poster/layout";
import { renderAnnouncementPoster } from "@/lib/poster/poster";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Downloads an announcement as a branded, signed A4 poster (PNG).
 * Only the Chairperson and Treasurer can use it; the signature is always the signed-in officer's own
 * name and title, never chosen by the request. Row Level Security still decides which announcements are readable.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return new Response("Not found", { status: 404 });

  const profile = await requireRole(posterSignerRoles, `/admin/announcements/${id}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, status, published_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });

  const published = data.status === "published";
  return renderAnnouncementPoster(
    {
      id: data.id,
      title: data.title,
      body: data.body,
      issuedAt: (published && data.published_at) || data.created_at,
      published,
      signer: { name: profile.full_name, title: roleLabels[profile.role] },
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${posterFileName(data.title)}"`,
        "Cache-Control": "private, no-store",
      },
    },
  );
}
