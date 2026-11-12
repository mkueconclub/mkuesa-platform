/**
 * Pure layout helpers for announcement posters (no I/O, unit-tested).
 * The poster is a fixed A4 page, so text is sized to fit and, as a last resort, shortened.
 */
export const POSTER_WIDTH = 1240;
export const POSTER_HEIGHT = 1754;

const TEXT_WIDTH = 1040; // page width minus side padding
const TITLE_LINE_HEIGHT = 1.12;
const BODY_LINE_HEIGHT = 1.55;
/** Vertical space left for title + body once header, signature, footer and spacing are taken out. */
const CONTENT_HEIGHT = 900;

const BODY_SIZES = [38, 34, 31, 28, 26, 24, 22, 20] as const;
const MIN_BODY_SIZE = BODY_SIZES[BODY_SIZES.length - 1];

export function titleFontSize(title: string): number {
  const n = title.length;
  if (n <= 36) return 76;
  if (n <= 64) return 64;
  if (n <= 110) return 54;
  return 46;
}

function titleHeight(title: string, size: number): number {
  const perLine = Math.floor(TEXT_WIDTH / (size * 0.5));
  const lines = Math.max(1, Math.ceil(title.length / perLine));
  return lines * size * TITLE_LINE_HEIGHT + 28;
}

/** Rough height of body text at a given size. Deliberately conservative (word wrapping wastes space). */
export function estimateBodyHeight(text: string, size: number): number {
  const perLine = Math.floor((TEXT_WIDTH / (size * 0.46)) * 0.93);
  const lines = text.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / perLine)), 0);
  return lines * size * BODY_LINE_HEIGHT;
}

export function cleanBody(raw: string): string {
  return raw.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Ends the text at the last paragraph or sentence break if one is near the end, otherwise at a word. */
function cleanCut(cut: string): string {
  const floor = cut.length * 0.65;
  const paragraph = cut.lastIndexOf("\n\n");
  if (paragraph > floor) return cut.slice(0, paragraph).trimEnd();
  const sentence = Math.max(...[". ", "! ", "? "].map((m) => cut.lastIndexOf(m)));
  if (sentence > floor) return cut.slice(0, sentence + 1);
  const space = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("\n"));
  return (space > floor ? cut.slice(0, space) : cut).trimEnd();
}

export type FittedPoster = { titleSize: number; bodySize: number; body: string; truncated: boolean };

/** Picks the largest readable text size that fits the page; shortens the message only if even the smallest size cannot. */
export function fitPosterText(title: string, rawBody: string): FittedPoster {
  const body = cleanBody(rawBody);
  const titleSize = titleFontSize(title);
  const available = CONTENT_HEIGHT - titleHeight(title, titleSize);

  for (const size of BODY_SIZES) {
    if (estimateBodyHeight(body, size) <= available) return { titleSize, bodySize: size, body, truncated: false };
  }

  // Too long for one page: keep as many whole words as fit at the smallest size.
  let lo = 0;
  let hi = body.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (estimateBodyHeight(`${body.slice(0, mid)}…`, MIN_BODY_SIZE) <= available) lo = mid;
    else hi = mid - 1;
  }
  const clipped = cleanCut(body.slice(0, lo));
  const endsCleanly = /[.!?]$/.test(clipped);
  return { titleSize, bodySize: MIN_BODY_SIZE, body: endsCleanly ? clipped : `${clipped}…`, truncated: true };
}

const NAIROBI = "Africa/Nairobi";

export function posterDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: NAIROBI }).format(new Date(iso));
}

/** Short traceable reference, e.g. MKUESA/ANN/2026/A1B2C3, derived from the announcement id and date. */
export function posterReference(id: string, iso: string): string {
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: NAIROBI }).format(new Date(iso));
  return `MKUESA/ANN/${year}/${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function posterFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `mkuesa-announcement-${slug || "poster"}.png`;
}

/** Signature size so even a long name stays on one line within the signature block (script glyphs average ~0.4em). */
export function signatureFontSize(name: string): number {
  return Math.max(34, Math.min(92, Math.floor(SIGNATURE_WIDTH / (Math.max(name.length, 1) * 0.4))));
}

export const SIGNATURE_WIDTH = 500;
