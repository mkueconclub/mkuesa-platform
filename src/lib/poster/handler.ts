import { roleLabels, type UserRole } from "@/lib/auth/roles";
import { parsePosterFormat, posterFileName, type PosterKind } from "@/lib/poster/layout";
import { renderPoster } from "@/lib/poster/poster";
import { loadPosterData } from "@/lib/poster/source";

export const POSTER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Shared by the three poster routes. The caller has already checked the role (each route does it itself).
 * The signature is always the signed-in admin's own name and title, never something the request can choose.
 * `?format=` picks the size (default A4); `?inline=1` shows the image in the browser instead of downloading it.
 */
export async function posterResponse(kind: PosterKind, id: string, profile: { full_name: string; role: UserRole }, request: Request) {
  const url = new URL(request.url);
  const format = parsePosterFormat(url.searchParams.get("format"));
  const inline = url.searchParams.get("inline") === "1";

  const data = await loadPosterData(kind, id, { name: profile.full_name, title: roleLabels[profile.role] });
  if (!data) return new Response("Not found", { status: 404 });

  return renderPoster(data, format, {
    headers: {
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${posterFileName(data.title, kind, format)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
