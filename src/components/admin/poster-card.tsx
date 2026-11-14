import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { posterFormatOrder, posterFormats } from "@/lib/poster/layout";

/**
 * "Share as a poster" panel on an announcement, event or opportunity.
 * Each size is a plain link to the poster route, which signs the poster with the signed-in administrator's own name.
 */
export function PosterCard({
  basePath,
  id,
  noun,
  signer,
  published,
  membersOnly,
}: {
  basePath: string;
  id: string;
  noun: string;
  signer: string;
  published: boolean;
  membersOnly: boolean;
}) {
  return (
    <div id="poster">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl text-brand-900">Share as a poster</h2>
          <p className="text-sm text-muted">
            Turn this {noun} into a branded MKUESA poster with the logo, the key details and a signature, signed as <strong className="text-ink">{signer}</strong>. Pick the size for where you will post it.
          </p>
        </div>
        {!published && <Notice tone="pending">This {noun} is not published yet, so the poster is marked DRAFT.</Notice>}
        {membersOnly && <Notice tone="pending">This {noun} is for members only. Check that it is fine to share it publicly before posting the poster.</Notice>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {posterFormatOrder.map((format) => {
            const f = posterFormats[format];
            const href = `${basePath}/${id}/poster?format=${format}`;
            return (
              <li key={format} className="flex flex-col justify-between gap-3 rounded-xl border border-brand-100 p-4">
                <div>
                  <p className="font-semibold text-ink">
                    {f.label} <span className="font-normal text-muted">· {f.width}×{f.height}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{f.note}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={href} download className={buttonClass("primary")}>Download<span className="sr-only"> {f.label} poster</span></a>
                  <a href={`${href}&inline=1`} target="_blank" rel="noopener noreferrer" className={buttonClass("outline")}>Preview<span className="sr-only"> {f.label} poster</span></a>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted">The social sizes show a short excerpt of the text. The A4 version carries the full message where it fits.</p>
      </Card>
    </div>
  );
}
