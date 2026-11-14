import { posterSignerRoles } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { POSTER_UUID_RE, posterResponse } from "@/lib/poster/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Downloads this announcement as a branded, signed poster (PNG) in the size chosen with ?format=
 * (portrait, story, square, landscape or a4). Any administrator can use it; the signature is always the
 * signed-in administrator's own name and title. Row Level Security still decides what is readable.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!POSTER_UUID_RE.test(id)) return new Response("Not found", { status: 404 });

  const profile = await requireRole(posterSignerRoles, `/admin/announcements/${id}`);
  return posterResponse("announcement", id, profile, request);
}
