import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { safeWebUrl } from "@/lib/public/filters";

/** A link to another website: opens in a new tab, never passes the referrer or window access, and refuses non-web addresses. */
export function ExternalLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const url = safeWebUrl(href);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand-700 hover:underline">
      {children}
      <ExternalLinkIcon aria-hidden className="size-4" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
