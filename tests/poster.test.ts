import { describe, expect, it } from "vitest";
import { can, posterSignerRoles } from "@/lib/auth/permissions";
import { userRoles } from "@/lib/auth/roles";
import { staffRoles } from "@/lib/auth/roles";
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  cleanBody,
  eventFacts,
  fitPosterText,
  opportunityEyebrow,
  opportunityFacts,
  parsePosterFormat,
  plainText,
  posterCta,
  posterExcerpt,
  posterFileName,
  posterFormatOrder,
  posterFormats,
  posterReference,
  shortTitle,
  signatureFontSize,
  signatureName,
  type PosterFormat,
} from "@/lib/poster/layout";
import { renderAnnouncementPoster, renderPoster, type PosterData } from "@/lib/poster/poster";

describe("poster permissions", () => {
  it("lets every administrator (any staff role) download and sign a poster, but not ordinary members", () => {
    expect([...posterSignerRoles].sort()).toEqual([...staffRoles].sort());
    expect(userRoles.filter(can.downloadPoster).sort()).toEqual([...staffRoles].sort());
    expect(can.downloadPoster("member")).toBe(false);
  });
});

describe("poster text fitting", () => {
  it("keeps short messages large and whole", () => {
    const fit = fitPosterText("Careers panel", "Registration is now open.\n\nSeats are limited.");
    expect(fit.truncated).toBe(false);
    expect(fit.bodySize).toBeGreaterThanOrEqual(34);
    expect(fit.body).toContain("Seats are limited.");
  });

  it("shrinks text as the message grows, but never below the readable minimum", () => {
    const sizes = [100, 700, 1500, 2500].map((n) => fitPosterText("Title", "word ".repeat(n / 5)).bodySize);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(20);
  });

  it("shortens a message too long for one page and says so", () => {
    const long = Array.from({ length: 60 }, (_, i) => `Sentence number ${i + 1} explains another detail.`).join(" ");
    const fit = fitPosterText("A long announcement", long);
    expect(fit.truncated).toBe(true);
    expect(fit.body.length).toBeLessThan(long.length);
    expect(long.startsWith(fit.body.replace(/…$/, ""))).toBe(true);
  });

  it("normalises line endings and blank lines", () => {
    expect(cleanBody("  a\r\n\r\n\r\n\r\nb  \n")).toBe("a\n\nb");
  });
});

describe("poster helpers", () => {
  it("builds a safe download file name", () => {
    expect(posterFileName("Careers Panel: Registration (2026)!")).toBe("mkuesa-announcement-careers-panel-registration-2026.png");
    expect(posterFileName("!!!")).toBe("mkuesa-announcement-poster.png");
    expect(posterFileName("a".repeat(300)).length).toBeLessThan(100);
  });

  it("derives a stable reference from the id and year (Nairobi time)", () => {
    const id = "a1b2c3d4-0000-4000-8000-000000000000";
    expect(posterReference(id, "2026-11-12T08:00:00Z")).toBe("MKUESA/ANN/2026/A1B2C3");
    expect(posterReference(id, "2026-12-31T22:00:00Z")).toBe("MKUESA/ANN/2027/A1B2C3"); // already 2027 in Nairobi
  });

  it("scales the signature down for long names", () => {
    expect(signatureFontSize("Brian Angwenyi")).toBeGreaterThan(signatureFontSize("Joy Wanjiru Masinde-Kamau"));
    expect(signatureFontSize("x".repeat(80))).toBeGreaterThanOrEqual(34);
  });
});

describe("poster rendering", () => {
  const base = { id: "a1b2c3d4-0000-4000-8000-000000000000", title: "Careers panel", body: "Registration is now open.", issuedAt: "2026-11-12T08:00:00Z" };

  for (const published of [true, false]) {
    it(`renders an A4 PNG (${published ? "published" : "draft"})`, async () => {
      const res = await renderAnnouncementPoster({ ...base, published, signer: { name: "Brian Angwenyi", title: "Chairperson" } });
      const bytes = Buffer.from(await res.arrayBuffer());
      expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(bytes.readUInt32BE(16)).toBe(POSTER_WIDTH);
      expect(bytes.readUInt32BE(20)).toBe(POSTER_HEIGHT);
    }, 60_000);
  }
});

describe("poster formats", () => {
  it("offers the social sizes with the right proportions", () => {
    expect(posterFormats.portrait).toMatchObject({ width: 1080, height: 1350 });
    expect(posterFormats.story).toMatchObject({ width: 1080, height: 1920 });
    expect(posterFormats.square).toMatchObject({ width: 1080, height: 1080 });
    expect(posterFormats.landscape).toMatchObject({ width: 1600, height: 900 });
    expect(posterFormats.a4).toMatchObject({ width: POSTER_WIDTH, height: POSTER_HEIGHT });
    expect([...posterFormatOrder].sort()).toEqual(Object.keys(posterFormats).sort());
  });

  it("falls back to A4 for a missing or unknown format, so the original download link still works", () => {
    expect(parsePosterFormat(null)).toBe("a4");
    expect(parsePosterFormat("nonsense")).toBe("a4");
    expect(parsePosterFormat("story")).toBe("story");
  });

  it("names files by kind and size without changing the original A4 announcement name", () => {
    expect(posterFileName("Careers panel")).toBe("mkuesa-announcement-careers-panel.png");
    expect(posterFileName("Careers panel", "event", "story")).toBe("mkuesa-event-careers-panel-story.png");
    expect(posterFileName("Graduate Trainee", "opportunity", "a4")).toBe("mkuesa-opportunity-graduate-trainee.png");
  });

  it("builds a reference with a code for the kind", () => {
    const id = "a1b2c3d4-0000-4000-8000-000000000000";
    expect(posterReference(id, "2026-11-12T08:00:00Z", "event")).toBe("MKUESA/EVT/2026/A1B2C3");
    expect(posterReference(id, "2026-11-12T08:00:00Z", "opportunity")).toBe("MKUESA/OPP/2026/A1B2C3");
  });
});

describe("signature name", () => {
  it("rewrites ALL CAPS and all-lowercase names so the script font stays readable", () => {
    expect(signatureName("MKUESA CHAIR")).toBe("Mkuesa Chair");
    expect(signatureName("joy wanjiru")).toBe("Joy Wanjiru");
    expect(signatureName("MASINDE-KAMAU O'BRIEN")).toBe("Masinde-Kamau O'Brien");
  });
  it("keeps names that are already mixed case exactly as typed", () => {
    expect(signatureName("Brian Angwenyi")).toBe("Brian Angwenyi");
    expect(signatureName("Jo McDonald")).toBe("Jo McDonald");
    expect(signatureName("  Brian   Angwenyi ")).toBe("Brian Angwenyi");
  });
});

describe("poster content helpers", () => {
  it("turns pasted markdown into plain text", () => {
    expect(plainText("## Hello\n\n**Join** us at [the hall](https://x.test) `today`\n- one\n- two")).toBe("Hello\n\nJoin us at the hall today\n• one\n• two");
  });

  it("shortens an excerpt at a sentence or word, never mid-word, and skips it when there is no room", () => {
    const text = "First sentence is here. Second sentence follows on. Third sentence is the long tail of the message.";
    expect(posterExcerpt(text, 500)).toBe(text);
    expect(posterExcerpt(text, 60)).toBe("First sentence is here. Second sentence follows on.");
    const cut = posterExcerpt("alpha beta gamma delta epsilon zeta eta theta iota kappa lambda", 45);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut).not.toMatch(/\b(la|lam|lamb)…$/);
    expect(posterExcerpt(text, 20)).toBe("");
  });

  it("clamps long titles", () => {
    expect(shortTitle("x".repeat(300)).length).toBeLessThanOrEqual(110);
    expect(shortTitle("Short title")).toBe("Short title");
  });

  it("lists event details in Nairobi time", () => {
    const facts = eventFacts({ starts_at: "2026-11-22T11:00:00Z", ends_at: "2026-11-22T14:00:00Z", location: "Auditorium B", registration_required: true, registration_deadline: "2026-11-20T15:00:00Z" });
    expect(facts.map((f) => f.label)).toEqual(["Date", "Time", "Venue", "Register by"]);
    expect(facts[0].value).toContain("22 November 2026");
    expect(facts[1].value).toBe("2:00 PM – 5:00 PM");
    expect(facts[3].value).toContain("20 November 2026");
  });

  it("handles events that run past midnight and events with no end or venue", () => {
    const multi = eventFacts({ starts_at: "2026-11-22T06:00:00Z", ends_at: "2026-11-23T14:00:00Z", location: null, registration_required: false, registration_deadline: null });
    expect(multi.map((f) => f.label)).toEqual(["Date", "Time", "Ends"]);
    const open = eventFacts({ starts_at: "2026-11-22T06:00:00Z", ends_at: null, location: null, registration_required: false, registration_deadline: null });
    expect(open[1].value).toBe("9:00 AM EAT");
  });

  it("lists opportunity details and labels the type", () => {
    const facts = opportunityFacts({ organisation: "KRA", category: "career", location: null, deadline: "2026-12-15T20:59:00Z" });
    expect(facts.map((f) => f.label)).toEqual(["Organisation", "Type", "Deadline"]);
    expect(opportunityEyebrow("career")).toBe("CAREER OPPORTUNITY");
  });

  it("points each kind of poster at the right page", () => {
    expect(posterCta("event", "mkuesa.org", "careers-panel", true)).toEqual({ label: "REGISTER", url: "mkuesa.org/events/careers-panel" });
    expect(posterCta("event", "mkuesa.org", "open-day", false).label).toBe("EVENT DETAILS");
    expect(posterCta("opportunity", "mkuesa.org").url).toBe("mkuesa.org/opportunities");
    expect(posterCta("announcement", "mkuesa.org").url).toBe("mkuesa.org");
  });
});

describe("social poster rendering", () => {
  const id = "a1b2c3d4-0000-4000-8000-000000000000";
  const signer = { name: "Brian Angwenyi", title: "Chairperson" };
  const event: PosterData = {
    id,
    kind: "event",
    title: "Careers in Economics: Industry Panel & Networking Evening",
    body: "Join practising economists for a candid evening.\n\nBring your CV.",
    issuedAt: "2026-11-10T08:00:00Z",
    published: true,
    signer,
    eyebrow: "UPCOMING EVENT",
    facts: eventFacts({ starts_at: "2026-11-22T11:00:00Z", ends_at: "2026-11-22T14:00:00Z", location: "MKU Thika Main Campus", registration_required: true, registration_deadline: "2026-11-20T15:00:00Z" }),
    cta: posterCta("event", "mkuesa.org", "careers-panel", true),
  };
  const worst: PosterData = { ...event, title: "T".repeat(200), body: "word ".repeat(2000), signer: { name: "Wanjiru Masinde-Kamau Otieno Njoroge", title: "Membership Coordinator" }, facts: eventFacts({ starts_at: "2026-11-22T06:00:00Z", ends_at: "2026-11-23T14:00:00Z", location: "V".repeat(300), registration_required: true, registration_deadline: "2026-11-20T15:00:00Z" }) };

  for (const format of posterFormatOrder as readonly PosterFormat[]) {
    for (const [name, data] of [["typical", event], ["worst-case", worst], ["draft", { ...event, published: false }]] as const) {
      it(`renders ${name} content as a ${format} PNG of the exact size`, async () => {
        const res = await renderPoster(data, format);
        const bytes = Buffer.from(await res.arrayBuffer());
        expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        expect(bytes.readUInt32BE(16)).toBe(posterFormats[format].width);
        expect(bytes.readUInt32BE(20)).toBe(posterFormats[format].height);
      }, 60_000);
    }
  }
});
