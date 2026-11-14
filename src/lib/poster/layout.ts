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
export function cleanCut(cut: string): string {
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
export function fitPosterText(title: string, rawBody: string, reserved = 0): FittedPoster {
  const body = cleanBody(rawBody);
  const titleSize = titleFontSize(title);
  const available = CONTENT_HEIGHT - titleHeight(title, titleSize) - reserved;

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
export function posterReference(id: string, iso: string, kind: PosterKind = "announcement"): string {
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: NAIROBI }).format(new Date(iso));
  return `MKUESA/${posterKinds[kind].code}/${year}/${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function posterFileName(title: string, kind: PosterKind = "announcement", format: PosterFormat = "a4"): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `mkuesa-${posterKinds[kind].file}-${slug || "poster"}${format === "a4" ? "" : `-${format}`}.png`;
}

/** Signature size so even a long name stays on one line within the signature block (script glyphs average ~0.4em). */
export function signatureFontSize(name: string, width = SIGNATURE_WIDTH, max = 92): number {
  return Math.max(34, Math.min(max, Math.floor(width / (Math.max(name.length, 1) * 0.34))));
}

export const SIGNATURE_WIDTH = 500;

// ---------------------------------------------------------------------------------------------
// Poster kinds, social formats and content helpers (pure, unit-tested)
// ---------------------------------------------------------------------------------------------

export type PosterKind = "announcement" | "event" | "opportunity";

export const posterKinds: Record<PosterKind, { code: string; file: string }> = {
  announcement: { code: "ANN", file: "announcement" },
  event: { code: "EVT", file: "event" },
  opportunity: { code: "OPP", file: "opportunity" },
};

export type PosterFormat = "story" | "portrait" | "square" | "landscape" | "a4";

export const posterFormats: Record<PosterFormat, { label: string; note: string; width: number; height: number }> = {
  portrait: { label: "Portrait 4:5", note: "Instagram feed, WhatsApp groups, Facebook and LinkedIn posts", width: 1080, height: 1350 },
  story: { label: "Story 9:16", note: "WhatsApp Status, Instagram and Facebook Stories", width: 1080, height: 1920 },
  square: { label: "Square 1:1", note: "Instagram, WhatsApp, LinkedIn and Facebook", width: 1080, height: 1080 },
  landscape: { label: "Landscape 16:9", note: "X (Twitter) and LinkedIn link posts", width: 1600, height: 900 },
  a4: { label: "Official A4", note: "Printing, noticeboards and email attachments", width: POSTER_WIDTH, height: POSTER_HEIGHT },
};

export const posterFormatOrder: readonly PosterFormat[] = ["portrait", "story", "square", "landscape", "a4"];

/** Unknown or missing values fall back to A4, which is what the original download link produced. */
export function parsePosterFormat(value: string | null | undefined): PosterFormat {
  return posterFormatOrder.find((f) => f === value) ?? "a4";
}

export type PosterFact = { label: string; value: string };

export function clampText(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Strips the light formatting people paste into a message (markdown links, headings, bold) so it reads cleanly on a poster. */
export function plainText(raw: string): string {
  return cleanBody(raw)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

/** A short excerpt for the social sizes: whole sentences where possible, never cut mid-word. */
export function posterExcerpt(raw: string, max: number): string {
  if (max < 40) return "";
  const text = plainText(raw);
  if (text.length <= max) return text;
  const cut = cleanCut(text.slice(0, max));
  return /[.!?]$/.test(cut) ? cut : `${cut}…`;
}

/** Title for the social sizes, which have less room than A4. */
export function shortTitle(title: string, max = 110): string {
  return clampText(title, max);
}

const dayFmt = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: NAIROBI }).format(new Date(iso));
const timeFmt = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: NAIROBI }).format(new Date(iso)).replace(/\s*([ap])\.?m\.?/i, (_, x: string) => ` ${x.toUpperCase()}M`);
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: NAIROBI }).format(new Date(iso));

export type EventPosterInput = {
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  registration_required: boolean;
  registration_deadline: string | null;
};

export function eventFacts(e: EventPosterInput): PosterFact[] {
  const facts: PosterFact[] = [{ label: "Date", value: dayFmt(e.starts_at) }];
  const sameDay = !e.ends_at || dayKey(e.ends_at) === dayKey(e.starts_at);
  facts.push({ label: "Time", value: sameDay && e.ends_at ? `${timeFmt(e.starts_at)} – ${timeFmt(e.ends_at)}` : `${timeFmt(e.starts_at)} EAT` });
  if (!sameDay && e.ends_at) facts.push({ label: "Ends", value: `${dayFmt(e.ends_at)}, ${timeFmt(e.ends_at)}` });
  if (e.location) facts.push({ label: "Venue", value: clampText(e.location, 60) });
  if (e.registration_required && e.registration_deadline) facts.push({ label: "Register by", value: dayFmt(e.registration_deadline) });
  return facts.slice(0, 4);
}

export type OpportunityPosterInput = { organisation: string | null; category: string; location: string | null; deadline: string | null };

const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function opportunityFacts(o: OpportunityPosterInput): PosterFact[] {
  const facts: PosterFact[] = [];
  if (o.organisation) facts.push({ label: "Organisation", value: clampText(o.organisation, 60) });
  facts.push({ label: "Type", value: titleCase(o.category) });
  if (o.location) facts.push({ label: "Location", value: clampText(o.location, 60) });
  if (o.deadline) facts.push({ label: "Deadline", value: dayFmt(o.deadline) });
  return facts.slice(0, 4);
}

export function opportunityEyebrow(category: string): string {
  return `${category.replace(/_/g, " ").toUpperCase()} OPPORTUNITY`;
}

export type PosterCta = { label: string; url: string };

/** Where the poster sends people. `host` is the site's host name without a scheme. */
export function posterCta(kind: PosterKind, host: string, slug?: string | null, registrationRequired = false): PosterCta {
  if (kind === "event") return { label: registrationRequired ? "REGISTER" : "EVENT DETAILS", url: slug ? `${host}/events/${slug}` : `${host}/events` };
  if (kind === "opportunity") return { label: "DETAILS & APPLY", url: `${host}/opportunities` };
  return { label: "MEMBER PORTAL", url: host };
}

export function signedOn(iso: string): string {
  return posterDate(iso);
}

/**
 * Name as it is written in the handwritten signature. Script fonts turn ALL CAPS into an unreadable tangle,
 * so a name typed in capitals (or all lower case) is written as "Mkuesa Chair". Mixed-case names are kept as typed.
 */
export function signatureName(name: string): string {
  const clean = name.replace(/\s+/g, " ").trim();
  if (clean !== clean.toUpperCase() && clean !== clean.toLowerCase()) return clean;
  return clean.toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}
