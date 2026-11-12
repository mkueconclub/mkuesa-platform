import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  SIGNATURE_WIDTH,
  fitPosterText,
  posterDate,
  posterReference,
  signatureFontSize,
} from "@/lib/poster/layout";

export type PosterData = {
  id: string;
  title: string;
  body: string;
  /** ISO timestamp the announcement was published (or created, for drafts). */
  issuedAt: string;
  published: boolean;
  signer: { name: string; title: string };
};

const C = {
  ink: "#1d1526",
  muted: "#525b6e",
  paper: "#fbf8f1",
  brand950: "#220131",
  brand900: "#3a024e",
  brand800: "#4f036b",
  brand500: "#9006bf",
  brand200: "#ddb4f0",
  brand100: "#efd9f8",
  accent500: "#e26716",
  accent400: "#f0872f",
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

function Poster({ data, logo }: { data: PosterData; logo: string }) {
  const fit = fitPosterText(data.title, data.body);
  const host = new URL(siteConfig.url).host;
  const ref = posterReference(data.id, data.issuedAt);

  return (
    <div style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, display: "flex", flexDirection: "column", position: "relative", background: C.paper, fontFamily: "Public Sans", color: C.ink }}>
      {/* Letterhead */}
      <div style={{ display: "flex", alignItems: "center", height: 290, padding: "28px 90px 0", gap: 40, backgroundImage: `linear-gradient(120deg, ${C.brand950} 0%, ${C.brand900} 100%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={158} height={158} alt="" style={{ width: 158, height: 158, borderRadius: 79, border: `5px solid ${C.accent500}`, objectFit: "cover" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontFamily: "Newsreader", fontWeight: 600, fontSize: 92, lineHeight: 1, letterSpacing: 3, color: "#ffffff" }}>MKUESA</div>
          <div style={{ marginTop: 14, fontWeight: 600, fontSize: 21, letterSpacing: 3, lineHeight: 1.4, color: C.brand100 }}>MOUNT KENYA UNIVERSITY ECONOMICS STUDENTS ASSOCIATION</div>
          <div style={{ marginTop: 10, fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 600, fontSize: 32, color: C.accent400 }}>{siteConfig.tagline}</div>
        </div>
      </div>
      <div style={{ height: 12, backgroundImage: `linear-gradient(90deg, ${C.accent500}, ${C.brand500})` }} />

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 100px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ flex: 1, height: 2, background: C.brand200 }} />
          <div style={{ fontWeight: 700, fontSize: 23, letterSpacing: 7, color: C.accent700 }}>OFFICIAL ANNOUNCEMENT</div>
          <div style={{ flex: 1, height: 2, background: C.brand200 }} />
        </div>

        <div style={{ marginTop: 34, textAlign: "center", fontFamily: "Newsreader", fontWeight: 600, fontSize: fit.titleSize, lineHeight: 1.12, color: C.brand900, justifyContent: "center", display: "flex" }}>{data.title}</div>
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center", fontSize: 22, color: C.muted }}>
          {data.published ? "Issued" : "Draft prepared"} {posterDate(data.issuedAt)}
        </div>
        <div style={{ margin: "26px auto 30px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 90, height: 3, background: C.accent500 }} />
          <div style={{ width: 12, height: 12, background: C.accent500, transform: "rotate(45deg)" }} />
          <div style={{ width: 90, height: 3, background: C.accent500 }} />
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden", fontSize: fit.bodySize, lineHeight: 1.55, whiteSpace: "pre-wrap", color: C.ink }}>{fit.body}</div>
        {fit.truncated && (
          <div style={{ display: "flex", marginTop: 6, fontSize: 20, fontStyle: "italic", color: C.muted }}>The full announcement is available on the MKUESA member portal.</div>
        )}
      </div>

      {/* Signature */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "10px 100px 36px" }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 19, color: C.muted, lineHeight: 1.6 }}>
          <div style={{ display: "flex", fontWeight: 700, letterSpacing: 3, fontSize: 16, color: C.accent700 }}>REFERENCE</div>
          <div style={{ display: "flex", fontWeight: 600, color: C.ink }}>{ref}</div>
          <div style={{ display: "flex" }}>Issued by the Executive Committee</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: SIGNATURE_WIDTH }}>
          <div style={{ display: "flex", fontFamily: "Signature", fontSize: signatureFontSize(data.signer.name), lineHeight: 1, color: C.brand800, height: 96, alignItems: "flex-end", whiteSpace: "nowrap" }}>{data.signer.name}</div>
          <div style={{ width: SIGNATURE_WIDTH - 40, height: 2, background: C.ink, marginTop: 6 }} />
          <div style={{ display: "flex", marginTop: 12, fontWeight: 700, fontSize: 25, color: C.ink }}>{data.signer.name}</div>
          <div style={{ display: "flex", fontSize: 21, color: C.muted }}>{data.signer.title}, MKUESA</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 104, padding: "0 90px", background: C.brand950 }}>
        <div style={{ display: "flex", fontWeight: 600, fontSize: 20, color: C.brand100 }}>Member of the Kenya Economics Students Association (KESA)</div>
        <div style={{ display: "flex", fontWeight: 700, fontSize: 22, letterSpacing: 1, color: C.accent400 }}>{host}</div>
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

/** Renders the poster as a PNG response. `init.headers` are passed straight through. */
export async function renderAnnouncementPoster(data: PosterData, init?: { headers?: HeadersInit }) {
  const { fonts, logo } = await loadAssets();
  return new ImageResponse(<Poster data={data} logo={logo} />, {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    fonts,
    headers: init?.headers,
  });
}
