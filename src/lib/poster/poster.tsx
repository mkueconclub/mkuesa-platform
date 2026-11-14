import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  SIGNATURE_WIDTH,
  fitPosterText,
  plainText,
  posterDate,
  posterExcerpt,
  posterFormats,
  posterReference,
  shortTitle,
  signatureFontSize,
  signatureName,
  type PosterCta,
  type PosterFact,
  type PosterFormat,
  type PosterKind,
} from "@/lib/poster/layout";

export type PosterData = {
  id: string;
  title: string;
  body: string;
  /** ISO timestamp the item was published (or created, for drafts). */
  issuedAt: string;
  published: boolean;
  /** The signed-in admin who is downloading the poster. Always taken from their account, never from the request. */
  signer: { name: string; title: string };
  kind?: PosterKind;
  /** Small label above the title, e.g. "UPCOMING EVENT". */
  eyebrow?: string;
  /** Key details shown as a panel (date, venue, deadline ...). */
  facts?: PosterFact[];
  cta?: PosterCta;
  /** ISO timestamp of the download, printed beside the signature. Defaults to now. */
  signedAt?: string;
};

const C = {
  ink: "#1d1526",
  muted: "#525b6e",
  paper: "#fbf8f1",
  white: "#ffffff",
  brand950: "#220131",
  brand900: "#3a024e",
  brand800: "#4f036b",
  brand700: "#650487",
  brand500: "#9006bf",
  brand300: "#c58ae3",
  brand200: "#ddb4f0",
  brand100: "#efd9f8",
  accent500: "#e26716",
  accent400: "#f0872f",
  accent200: "#fdcb9f",
  accent700: "#9c4210",
};

type Font = { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" | "italic" };
type Assets = { fonts: Font[]; logo: string };

let cached: Promise<Assets> | undefined;

// Literal paths so the file tracer bundles these with the route (see outputFileTracingIncludes in next.config.ts).
function loadAssets(): Promise<Assets> {
  cached ??= (async () => {
    const [news600, news600i, sans400, sans600, sans700, script, logo] = await Promise.all([
      readFile(join(process.cwd(), "src/lib/poster/fonts/newsreader-latin-600-normal.woff")),
      readFile(join(process.cwd(), "src/lib/poster/fonts/newsreader-latin-600-italic.woff")),
      readFile(join(process.cwd(), "src/lib/poster/fonts/public-sans-latin-400-normal.woff")),
      readFile(join(process.cwd(), "src/lib/poster/fonts/public-sans-latin-600-normal.woff")),
      readFile(join(process.cwd(), "src/lib/poster/fonts/public-sans-latin-700-normal.woff")),
      readFile(join(process.cwd(), "src/lib/poster/fonts/mrs-saint-delafield-latin-400-normal.woff")),
      readFile(join(process.cwd(), "public/logos/mkuesa-logo-original-400.jpg")),
    ]);
    return {
      fonts: [
        { name: "Newsreader", data: news600, weight: 600, style: "normal" },
        { name: "Newsreader", data: news600i, weight: 600, style: "italic" },
        { name: "Public Sans", data: sans400, weight: 400, style: "normal" },
        { name: "Public Sans", data: sans600, weight: 600, style: "normal" },
        { name: "Public Sans", data: sans700, weight: 700, style: "normal" },
        { name: "Signature", data: script, weight: 400, style: "normal" },
      ],
      logo: `data:image/jpeg;base64,${logo.toString("base64")}`,
    };
  })();
  cached.catch(() => (cached = undefined)); // retry on the next request if a read failed
  return cached;
}

const DEFAULT_EYEBROW: Record<PosterKind, string> = {
  announcement: "OFFICIAL ANNOUNCEMENT",
  event: "UPCOMING EVENT",
  opportunity: "OPPORTUNITY",
};

// ---------------------------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------------------------

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill={color} />
    </svg>
  );
}

/** Round "official" stamp that sits beside the signature. */
function Seal({ size }: { size: number }) {
  const ring = Math.max(3, Math.round(size * 0.035));
  return (
    <div style={{ display: "flex", width: size, height: size, borderRadius: size / 2, border: `${ring}px solid ${C.accent500}`, background: C.brand900, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: size - ring * 2 - 14, height: size - ring * 2 - 14, borderRadius: size, border: `1px solid ${C.brand300}` }}>
        <div style={{ display: "flex", fontWeight: 700, fontSize: Math.round(size * 0.1), letterSpacing: 2, color: C.brand200 }}>OFFICIAL</div>
        <div style={{ display: "flex", margin: `${Math.round(size * 0.03)}px 0` }}>
          <Star size={Math.round(size * 0.17)} color={C.accent400} />
        </div>
        <div style={{ display: "flex", fontFamily: "Newsreader", fontWeight: 600, fontSize: Math.round(size * 0.145), letterSpacing: 0.5, color: C.white }}>MKUESA</div>
      </div>
    </div>
  );
}

/** Handwriting-style signature, a flourish, then the signer's printed name and title. */
function Signature({ name, title, width, sigMax, nameSize, titleSize }: { name: string; title: string; width: number; sigMax: number; nameSize: number; titleSize: number }) {
  const written = signatureName(name);
  const sig = signatureFontSize(written, width, sigMax);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width }}>
      <div style={{ display: "flex", fontFamily: "Signature", fontSize: sig, lineHeight: 1, color: C.brand800, height: Math.round(sigMax * 1.05), alignItems: "flex-end", whiteSpace: "nowrap" }}>{written}</div>
      <svg width={Math.round(width * 0.92)} height={22} viewBox="0 0 400 22">
        <path d="M4 15 C 70 2, 130 20, 210 11 S 340 4, 396 14" fill="none" stroke={C.accent500} strokeWidth={3} strokeLinecap="round" />
        <path d="M120 19 C 200 13, 290 19, 360 12" fill="none" stroke={C.brand300} strokeWidth={1.5} strokeLinecap="round" />
      </svg>
      <div style={{ display: "flex", marginTop: 8, fontWeight: 700, fontSize: nameSize, color: C.ink }}>{name}</div>
      <div style={{ display: "flex", fontSize: titleSize, color: C.muted }}>{`${title}, MKUESA`}</div>
    </div>
  );
}

function Decor({ w, h }: { w: number; h: number }) {
  const bars = [0.22, 0.3, 0.27, 0.4, 0.5, 0.46, 0.62, 0.74];
  const bw = Math.round(w * 0.045);
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, display: "flex", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, display: "flex", backgroundImage: `radial-gradient(circle at 92% 6%, rgba(226,103,22,0.42), rgba(226,103,22,0) 42%), radial-gradient(circle at 0% 100%, rgba(144,6,191,0.45), rgba(144,6,191,0) 55%)` }} />
      <svg style={{ position: "absolute", top: -Math.round(w * 0.3), right: -Math.round(w * 0.3) }} width={Math.round(w * 0.85)} height={Math.round(w * 0.85)} viewBox="0 0 900 900">
        {[430, 340, 250, 160].map((r) => (
          <circle key={r} cx={450} cy={450} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: Math.round(w * 0.05), bottom: Math.round(h * 0.2), display: "flex", alignItems: "flex-end", gap: Math.round(bw * 0.5) }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: "flex", width: bw, height: Math.round(h * 0.2 * b * 1.6), background: "rgba(255,255,255,0.045)", borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}

function Brand({ logo, size, name, sub }: { logo: string; size: number; name: number; sub: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.24) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={size} height={size} alt="" style={{ width: size, height: size, borderRadius: size / 2, border: `${Math.max(3, Math.round(size * 0.04))}px solid ${C.accent500}`, objectFit: "cover" }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "Newsreader", fontWeight: 600, fontSize: name, lineHeight: 1, letterSpacing: 3, color: C.white }}>MKUESA</div>
        <div style={{ display: "flex", marginTop: 6, fontWeight: 600, fontSize: sub, letterSpacing: 2, color: C.brand200 }}>ECONOMISTS UNITE</div>
      </div>
    </div>
  );
}

function Chip({ text, size }: { text: string; size: number }) {
  return (
    <div style={{ display: "flex", alignSelf: "flex-start", padding: `${Math.round(size * 0.45)}px ${Math.round(size * 1.1)}px`, borderRadius: 999, background: C.accent500, color: C.ink, fontWeight: 700, fontSize: size, letterSpacing: Math.round(size * 0.18) }}>{text}</div>
  );
}

function CtaBar({ cta, size, width, radius = 22 }: { cta: PosterCta; size: number; width: number; radius?: number }) {
  const padX = Math.round(size * 1.1);
  const labelPx = cta.label.length * (size * 0.72 * 0.68 + 3);
  const urlSize = Math.max(16, Math.min(size, Math.floor((width - padX * 2 - 24 - labelPx) / (cta.url.length * 0.56))));
  return (
    <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", gap: 24, padding: `${Math.round(size * 0.7)}px ${Math.round(size * 1.1)}px`, borderRadius: radius, background: C.accent500, color: C.ink }}>
      <div style={{ display: "flex", fontWeight: 700, fontSize: Math.round(size * 0.72), letterSpacing: 3 }}>{cta.label}</div>
      <div style={{ display: "flex", fontWeight: 700, fontSize: urlSize }}>{cta.url}</div>
    </div>
  );
}

function Facts({ facts, cols, label, value, width }: { facts: PosterFact[]; cols: 1 | 2; label: number; value: number; width: number }) {
  const gap = 18;
  const itemWidth = cols === 2 ? Math.floor((width - gap - 2 * 28 - 4) / 2) : width - 60;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap, width, flexShrink: 0, padding: 28, borderRadius: 26, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)" }}>
      {facts.map((f) => (
        <div key={f.label} style={{ display: "flex", flexDirection: "column", width: itemWidth }}>
          <div style={{ display: "flex", fontWeight: 700, fontSize: label, letterSpacing: 3, color: C.accent400 }}>{f.label.toUpperCase()}</div>
          <div style={{ display: "flex", marginTop: 4, fontWeight: 600, fontSize: value, lineHeight: 1.25, color: C.white }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Social posters: story (9:16), portrait (4:5) and square (1:1)
// ---------------------------------------------------------------------------------------------

type VerticalSpec = {
  pad: number;
  logo: number;
  brandName: number;
  brandSub: number;
  chip: number;
  titles: readonly [number, number, number, number];
  body: number;
  excerptMax: number;
  excerptPerRow: number;
  factCols: 1 | 2;
  factLabel: number;
  factValue: number;
  seal: number;
  sigMax: number;
  nameSize: number;
  cta: number;
  gap: number;
};

const VERTICAL: Record<"story" | "portrait" | "square", VerticalSpec> = {
  story: { pad: 84, logo: 118, brandName: 62, brandSub: 20, chip: 28, titles: [104, 90, 76, 64], body: 40, excerptMax: 400, excerptPerRow: 0, factCols: 1, factLabel: 22, factValue: 36, seal: 132, sigMax: 124, nameSize: 32, cta: 34, gap: 40 },
  portrait: { pad: 68, logo: 92, brandName: 52, brandSub: 17, chip: 23, titles: [84, 72, 62, 52], body: 31, excerptMax: 280, excerptPerRow: 55, factCols: 2, factLabel: 18, factValue: 29, seal: 108, sigMax: 94, nameSize: 27, cta: 28, gap: 26 },
  square: { pad: 56, logo: 72, brandName: 44, brandSub: 15, chip: 20, titles: [70, 60, 52, 44], body: 27, excerptMax: 160, excerptPerRow: 80, factCols: 2, factLabel: 16, factValue: 25, seal: 84, sigMax: 70, nameSize: 22, cta: 23, gap: 18 },
};

function pickTitle(title: string, sizes: readonly [number, number, number, number]) {
  const n = title.length;
  return n <= 30 ? sizes[0] : n <= 55 ? sizes[1] : n <= 85 ? sizes[2] : sizes[3];
}

/** How many lines of excerpt fit under the title and facts. Deliberately conservative so text is never cut mid-line. */
function bodyLines(spec: VerticalSpec, h: number, inner: number, title: string, titleSize: number, facts: PosterFact[], bodySize: number): number {
  const perLine = Math.max(8, Math.floor(inner / (titleSize * 0.5)));
  const titleH = Math.ceil(title.length / perLine) * titleSize * 1.08;
  const itemW = spec.factCols === 2 ? (inner - 18 - 64) / 2 : inner - 60;
  const rowsOf = (n: number) => {
    const rows: PosterFact[][] = [];
    for (let i = 0; i < facts.length; i += n) rows.push(facts.slice(i, i + n));
    return rows;
  };
  const factsH = facts.length
    ? rowsOf(spec.factCols).reduce((sum, row) => sum + Math.max(...row.map((f) => spec.factLabel * 1.3 + 4 + Math.ceil(f.value.length / Math.max(8, itemW / (spec.factValue * 0.56))) * spec.factValue * 1.25)), 0) + (Math.ceil(facts.length / spec.factCols) - 1) * 18 + 56 + spec.gap
    : 0;
  const sigH = Math.max(spec.seal, spec.sigMax * 1.05 + 30 + spec.nameSize * 2.4) + spec.pad * 0.8;
  const ctaH = spec.cta * 1.4 + spec.cta * 1.2;
  const fixed = spec.pad * 2 + spec.logo + spec.gap + 6 + spec.chip * 2.2 + spec.gap + titleH + spec.gap + 2 + factsH + spec.gap + sigH + spec.gap + ctaH + 16 + spec.brandSub * 1.4 + spec.gap;
  return Math.floor((h - fixed) / (bodySize * 1.45)) - 1; // one line of safety margin
}

function VerticalPoster({ data, logo, format }: { data: PosterData; logo: string; format: "story" | "portrait" | "square" }) {
  const spec = VERTICAL[format];
  const { width: w, height: h } = posterFormats[format];
  const kind = data.kind ?? "announcement";
  const facts = data.facts ?? [];
  const host = new URL(siteConfig.url).host;
  const cta = data.cta ?? { label: "MEMBER PORTAL", url: host };
  const title = shortTitle(data.title);
  const factRows = Math.ceil(facts.length / spec.factCols);
  const rawExcerpt = posterExcerpt(data.body, spec.excerptMax - factRows * spec.excerptPerRow);
  const bodySize = rawExcerpt.length <= 130 ? spec.body + 6 : rawExcerpt.length > 150 ? spec.body - 3 : spec.body;
  const inner = w - spec.pad * 2;
  const lines = bodyLines(spec, h, inner, title, pickTitle(title, spec.titles), facts, bodySize);
  const excerpt = lines >= 2 ? rawExcerpt : "";
  const ref = posterReference(data.id, data.issuedAt, kind);
  const signed = posterDate(data.signedAt ?? new Date().toISOString());

  return (
    <div style={{ width: w, height: h, display: "flex", flexDirection: "column", position: "relative", backgroundImage: `linear-gradient(160deg, ${C.brand950} 0%, ${C.brand900} 100%)`, fontFamily: "Public Sans", color: C.white }}>
      <Decor w={w} h={h} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: spec.pad, position: "relative" }}>
        <Brand logo={logo} size={spec.logo} name={spec.brandName} sub={spec.brandSub} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: spec.gap + 6, overflow: "hidden" }}>
          <div style={{ display: "flex", flexShrink: 0 }}><Chip text={data.eyebrow ?? DEFAULT_EYEBROW[kind]} size={spec.chip} /></div>
          <div style={{ display: "flex", marginTop: spec.gap, flexShrink: 0, fontFamily: "Newsreader", fontWeight: 600, fontSize: pickTitle(title, spec.titles), lineHeight: 1.08, color: C.white }}>{title}</div>
          <div style={{ display: "flex", width: 120, height: 6, flexShrink: 0, marginTop: spec.gap - 4, borderRadius: 3, background: C.accent500 }} />
          {facts.length > 0 && (
            <div style={{ display: "flex", flexShrink: 0, marginTop: spec.gap }}>
              <Facts facts={facts} cols={spec.factCols} label={spec.factLabel} value={spec.factValue} width={inner} />
            </div>
          )}
          {excerpt && (
            <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: spec.gap, overflow: "hidden", fontSize: bodySize, lineHeight: 1.45, whiteSpace: "pre-wrap", color: C.brand100, lineClamp: Math.min(lines, 8) }}>{excerpt}</div>
          )}
        </div>

        {/* Signature card */}
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: spec.gap, padding: `${Math.round(spec.pad * 0.4)}px ${Math.round(spec.pad * 0.5)}px`, borderRadius: 30, background: C.paper, flexShrink: 0 }}>
          <Seal size={spec.seal} />
          <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
            <Signature name={data.signer.name} title={data.signer.title} width={inner - spec.seal - 26 - Math.round(spec.pad)} sigMax={spec.sigMax} nameSize={spec.nameSize} titleSize={Math.round(spec.nameSize * 0.8)} />
          </div>
        </div>

        <div style={{ display: "flex", marginTop: spec.gap - 4 }}>
          <div style={{ display: "flex", flex: 1 }}>
            <CtaBar cta={cta} size={spec.cta} width={inner} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16, fontSize: Math.round(spec.brandSub * 1.05), color: C.brand200, letterSpacing: 0.5 }}>{`Ref ${ref}  ·  Signed ${signed}  ·  Member of KESA`}</div>
      </div>
      {!data.published && <DraftMark w={w} h={h} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Landscape (16:9) for X and LinkedIn
// ---------------------------------------------------------------------------------------------

function LandscapePoster({ data, logo }: { data: PosterData; logo: string }) {
  const { width: w, height: h } = posterFormats.landscape;
  const kind = data.kind ?? "announcement";
  const facts = data.facts ?? [];
  const host = new URL(siteConfig.url).host;
  const cta = data.cta ?? { label: "MEMBER PORTAL", url: host };
  const title = shortTitle(data.title, 100);
  const titleSize = pickTitle(title, [84, 72, 60, 50]);
  const excerpt = posterExcerpt(data.body, 250 - facts.length * 12);
  const ref = posterReference(data.id, data.issuedAt, kind);
  const signed = posterDate(data.signedAt ?? new Date().toISOString());
  const cardW = 540;

  return (
    <div style={{ width: w, height: h, display: "flex", position: "relative", backgroundImage: `linear-gradient(150deg, ${C.brand950} 0%, ${C.brand900} 100%)`, fontFamily: "Public Sans", color: C.white }}>
      <Decor w={w} h={h} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "58px 20px 52px 72px", position: "relative" }}>
        <Brand logo={logo} size={84} name={46} sub={15} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 36, overflow: "hidden" }}>
          <Chip text={data.eyebrow ?? DEFAULT_EYEBROW[kind]} size={21} />
          <div style={{ display: "flex", marginTop: 26, fontFamily: "Newsreader", fontWeight: 600, fontSize: titleSize, lineHeight: 1.08 }}>{title}</div>
          <div style={{ display: "flex", width: 110, height: 6, marginTop: 22, borderRadius: 3, background: C.accent500 }} />
          {excerpt && <div style={{ display: "flex", marginTop: 24, fontSize: 29, lineHeight: 1.45, whiteSpace: "pre-wrap", color: C.brand100, lineClamp: 4 }}>{excerpt}</div>}
        </div>
        <div style={{ display: "flex", width: w - cardW - 72 - 20 - 56 }}>
          <div style={{ display: "flex", flex: 1 }}>
            <CtaBar cta={cta} size={25} width={w - cardW - 72 - 20 - 56} radius={18} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", width: cardW, margin: "40px 40px 40px 0", padding: "34px 34px 26px", borderRadius: 34, background: C.paper, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
          {facts.length > 0 ? (
            facts.map((f) => (
              <div key={f.label} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontWeight: 700, fontSize: 16, letterSpacing: 3, color: C.accent700 }}>{f.label.toUpperCase()}</div>
                <div style={{ display: "flex", fontWeight: 600, fontSize: 25, lineHeight: 1.25, color: C.brand900 }}>{f.value}</div>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontWeight: 700, fontSize: 16, letterSpacing: 3, color: C.accent700 }}>ISSUED</div>
              <div style={{ display: "flex", fontWeight: 600, fontSize: 27, color: C.brand900 }}>{posterDate(data.issuedAt)}</div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 21, color: C.muted }}>By the Executive Committee</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", height: 2, background: C.brand100, margin: "10px 0 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Seal size={96} />
          <Signature name={data.signer.name} title={data.signer.title} width={cardW - 68 - 96 - 28} sigMax={68} nameSize={23} titleSize={18} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12, fontSize: 15, color: C.muted }}>{`Ref ${ref}  ·  Signed ${signed}`}</div>
      </div>
      {!data.published && <DraftMark w={w} h={h} />}
    </div>
  );
}

function DraftMark({ w, h }: { w: number; h: number }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontWeight: 700, fontSize: Math.round(Math.min(w, h) * 0.26), letterSpacing: 16, color: "rgba(255,255,255,0.10)", transform: "rotate(-28deg)" }}>DRAFT</div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Official A4 letter (printing, notice boards)
// ---------------------------------------------------------------------------------------------

function A4Poster({ data, logo }: { data: PosterData; logo: string }) {
  const kind = data.kind ?? "announcement";
  const facts = data.facts ?? [];
  const factRows = Math.ceil(facts.length / 2);
  const fit = fitPosterText(data.title, plainText(data.body), facts.length ? factRows * 92 + 44 : 0);
  const host = new URL(siteConfig.url).host;
  const cta = data.cta ?? { label: "MEMBER PORTAL", url: host };
  const ref = posterReference(data.id, data.issuedAt, kind);
  const signed = posterDate(data.signedAt ?? new Date().toISOString());

  return (
    <div style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, display: "flex", flexDirection: "column", position: "relative", background: C.paper, fontFamily: "Public Sans", color: C.ink }}>
      {/* Letterhead */}
      <div style={{ display: "flex", alignItems: "center", height: 290, padding: "28px 90px 0", gap: 40, backgroundImage: `linear-gradient(120deg, ${C.brand950} 0%, ${C.brand900} 100%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={158} height={158} alt="" style={{ width: 158, height: 158, borderRadius: 79, border: `5px solid ${C.accent500}`, objectFit: "cover" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontFamily: "Newsreader", fontWeight: 600, fontSize: 92, lineHeight: 1, letterSpacing: 3, color: C.white }}>MKUESA</div>
          <div style={{ display: "flex", marginTop: 14, fontWeight: 600, fontSize: 21, letterSpacing: 3, lineHeight: 1.4, color: C.brand100 }}>MOUNT KENYA UNIVERSITY ECONOMICS STUDENTS ASSOCIATION</div>
          <div style={{ display: "flex", marginTop: 10, fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 600, fontSize: 32, color: C.accent400 }}>{siteConfig.tagline}</div>
        </div>
      </div>
      <div style={{ display: "flex", height: 12, backgroundImage: `linear-gradient(90deg, ${C.accent500}, ${C.brand500})` }} />

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 100px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex", flex: 1, height: 2, background: C.brand200 }} />
          <div style={{ display: "flex", fontWeight: 700, fontSize: 23, letterSpacing: 7, color: C.accent700 }}>{data.eyebrow ?? DEFAULT_EYEBROW[kind]}</div>
          <div style={{ display: "flex", flex: 1, height: 2, background: C.brand200 }} />
        </div>

        <div style={{ marginTop: 30, textAlign: "center", fontFamily: "Newsreader", fontWeight: 600, fontSize: fit.titleSize, lineHeight: 1.12, color: C.brand900, justifyContent: "center", display: "flex" }}>{data.title}</div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center", fontSize: 22, color: C.muted }}>{`${data.published ? "Issued" : "Draft prepared"} ${posterDate(data.issuedAt)}`}</div>
        <div style={{ margin: "22px auto 26px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 90, height: 3, background: C.accent500 }} />
          <div style={{ display: "flex", width: 12, height: 12, background: C.accent500, transform: "rotate(45deg)" }} />
          <div style={{ display: "flex", width: 90, height: 3, background: C.accent500 }} />
        </div>

        {facts.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", padding: "22px 28px", marginBottom: 22, borderRadius: 20, background: C.brand900 }}>
            {facts.map((f) => (
              <div key={f.label} style={{ display: "flex", flexDirection: "column", width: 453 }}>
                <div style={{ display: "flex", fontWeight: 700, fontSize: 16, letterSpacing: 3, color: C.accent400 }}>{f.label.toUpperCase()}</div>
                <div style={{ display: "flex", fontWeight: 600, fontSize: 27, lineHeight: 1.2, color: C.white }}>{f.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flex: 1, overflow: "hidden", fontSize: fit.bodySize, lineHeight: 1.55, whiteSpace: "pre-wrap", color: C.ink }}>{fit.body}</div>
        {fit.truncated && (
          <div style={{ display: "flex", marginTop: 6, fontSize: 20, fontStyle: "italic", color: C.muted }}>The full text is available on the MKUESA portal.</div>
        )}
      </div>

      {/* Signature */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "10px 100px 34px" }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 19, color: C.muted, lineHeight: 1.6 }}>
          <div style={{ display: "flex", fontWeight: 700, letterSpacing: 3, fontSize: 16, color: C.accent700 }}>REFERENCE</div>
          <div style={{ display: "flex", fontWeight: 600, color: C.ink }}>{ref}</div>
          <div style={{ display: "flex" }}>Issued by the Executive Committee</div>
          <div style={{ display: "flex" }}>{`Signed ${signed}`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <Seal size={118} />
          <Signature name={data.signer.name} title={data.signer.title} width={SIGNATURE_WIDTH - 110} sigMax={100} nameSize={25} titleSize={21} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 104, padding: "0 90px", background: C.brand950 }}>
        <div style={{ display: "flex", fontWeight: 600, fontSize: 20, color: C.brand100 }}>Member of the Kenya Economics Students Association (KESA)</div>
        <div style={{ display: "flex", fontWeight: 700, fontSize: 22, letterSpacing: 1, color: C.accent400 }}>{cta.url}</div>
      </div>

      {/* Frame */}
      <div style={{ position: "absolute", top: 22, left: 22, right: 22, bottom: 22, border: `3px solid ${C.accent500}`, display: "flex" }} />

      {!data.published && (
        <div style={{ position: "absolute", top: 0, left: 0, width: POSTER_WIDTH, height: POSTER_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontWeight: 700, fontSize: 300, letterSpacing: 20, color: "rgba(144,6,191,0.08)", transform: "rotate(-28deg)" }}>DRAFT</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

/** Renders a poster in the chosen size as a PNG response. `init.headers` are passed straight through. */
export async function renderPoster(data: PosterData, format: PosterFormat, init?: { headers?: HeadersInit }) {
  const { fonts, logo } = await loadAssets();
  const { width, height } = posterFormats[format];
  const element =
    format === "a4" ? <A4Poster data={data} logo={logo} /> : format === "landscape" ? <LandscapePoster data={data} logo={logo} /> : <VerticalPoster data={data} logo={logo} format={format} />;
  return new ImageResponse(element, { width, height, fonts, headers: init?.headers });
}

/** The original A4 announcement poster. Kept so existing callers and tests keep working. */
export function renderAnnouncementPoster(data: PosterData, init?: { headers?: HeadersInit }) {
  return renderPoster(data, "a4", init);
}
