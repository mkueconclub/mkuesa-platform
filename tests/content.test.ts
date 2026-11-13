import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { association, contact, privacyNoticeVersion, visibleCommittee } from "@/config/association";
import { opportunityCategories, publicationTypes, resourceCategories } from "@/config/taxonomy";
import { excerpt, hasEnded, isOpenOpportunity, partitionEvents, safeWebUrl } from "@/lib/public/filters";
import { dateParts, formatEventDate } from "@/lib/utils/date";
import { read, sqlFiles, srcFiles, walk } from "./support-fs";

describe("official association content", () => {
  it("has the four supplied core values", () => {
    expect([...association.values]).toEqual(["Integrity", "Discipline", "Honesty", "Teamwork"]);
  });
  it("has mission and vision text", () => {
    expect(association.mission.length).toBeGreaterThan(20);
    expect(association.vision.length).toBeGreaterThan(20);
  });
});

describe("official contact", () => {
  it("is the association's own email address, written in one place only", () => {
    expect(contact.email).toBe("mkueconclub@gmail.com");
    expect(contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    const holders = srcFiles().filter((f) => read(f).includes(contact.email));
    expect(holders).toEqual(["src/config/association.ts"]);
  });
  it("is shown on the contact page, the privacy notice, the membership page, the about page and the footer", () => {
    for (const f of ["src/app/(public)/contact/page.tsx", "src/app/(public)/privacy/page.tsx", "src/app/(public)/membership/page.tsx", "src/app/(public)/about/page.tsx", "src/components/layout/site-footer.tsx"]) {
      expect(read(f)).toMatch(/contact\.email/);
    }
  });
  it("does not publish a phone number, office or social link that has not been supplied", () => {
    const contactPage = read("src/app/(public)/contact/page.tsx");
    expect(contactPage).not.toMatch(/\+?\d[\d\s-]{8,}|facebook|instagram|twitter|linkedin|whatsapp/i);
  });
});

describe("executive committee privacy", () => {
  it("hides every name by default (consent not yet confirmed)", () => {
    const committee = visibleCommittee();
    expect(committee).toHaveLength(5);
    expect(committee.every((m) => m.name === null)).toBe(true);
  });
  it("shows names only when publication is explicitly enabled", () => {
    const shown = visibleCommittee(true);
    expect(shown.find((m) => m.title === "Chairperson")?.name).toBe("Brian Angwenyi");
    expect(shown.find((m) => m.title === "Membership Coordinator")?.name).toBeNull();
  });
  it("the About page prints a name only when there is one, never a placeholder", () => {
    const about = read("src/app/(public)/about/page.tsx");
    expect(about).toMatch(/named && m\.name/);
  });
});

describe("public pages read as final, official wording", () => {
  const dirs = ["src/app/(public)", "src/components/public", "src/components/layout", "src/config"];
  const files = dirs.flatMap((d) => walk(d, [".ts", ".tsx"]));
  const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  const FORBIDDEN =
    /to be (supplied|announced|confirmed)|will be added once|once (provided|supplied|confirmed)|sample (content|events?|listings?|resources?|publications?|announcements?)|shown to demonstrate|placeholder|draft for confirmation|not yet reviewed|coming soon|opens soon|lorem ipsum|\bTBC\b|\bTBA\b/i;

  it("scans a meaningful number of files", () => expect(files.length).toBeGreaterThan(25));
  it("contains no draft, placeholder or 'to be supplied' wording", () => {
    const bad = files
      .map((f) => ({ f, hit: stripComments(read(f)).match(FORBIDDEN)?.[0] }))
      .filter((x) => x.hit)
      .map((x) => `${x.f}: "${x.hit}"`);
    expect(bad).toEqual([]);
  });
  it("no longer ships the placeholder content file or placeholder page component", () => {
    expect(existsSync("src/config/sample-content.ts")).toBe(false);
    expect(existsSync("src/components/public/page-placeholder.tsx")).toBe(false);
    expect(srcFiles().filter((f) => read(f).includes("sample-content"))).toEqual([]);
  });
  it("the privacy notice is a final notice with a version, not a draft", () => {
    expect(privacyNoticeVersion).not.toMatch(/draft/i);
    expect(read("src/app/(public)/privacy/page.tsx")).not.toMatch(/draft/i);
  });
  it("sections for things the association has not supplied (history, objectives, constitution, fees) are not on the site", () => {
    const text = ["about", "membership"].map((p) => read(`src/app/(public)/${p}/page.tsx`)).join("\n");
    expect(text).not.toMatch(/Constitution|Association objectives|>Background<|Requirements|fees/);
  });
  it("events, learning hub, opportunities and the home page show live database content", () => {
    for (const [f, fn] of [
      ["events/page.tsx", "getEvents"],
      ["events/[slug]/page.tsx", "getEventBySlug"],
      ["learning-hub/page.tsx", "getResources"],
      ["opportunities/page.tsx", "getOpportunities"],
      ["page.tsx", "getAnnouncements"],
    ]) expect(read(`src/app/(public)/${f}`)).toContain(fn);
  });
});

describe("categories match the database", () => {
  const sql = sqlFiles().map((f) => read(f)).join("\n");
  const enumValues = (name: string) => {
    const m = sql.match(new RegExp(`create type public\\.${name} as enum \\(([^)]+)\\)`));
    expect(m).toBeTruthy();
    return m![1].split(",").map((v) => v.trim().replace(/'/g, ""));
  };
  it("resource categories", () => expect(resourceCategories.map((c) => c.id)).toEqual(enumValues("resource_category")));
  it("publication types (a mismatch here would hide published work from the public Research page)", () => expect(publicationTypes.map((c) => c.id)).toEqual(enumValues("publication_type")));
  it("opportunity categories", () => expect(opportunityCategories.map((c) => c.id)).toEqual(enumValues("opportunity_category")));
});

describe("public list helpers", () => {
  const now = new Date("2026-11-12T10:00:00Z");
  it("excerpt keeps short text, cuts long text at a word and adds an ellipsis", () => {
    expect(excerpt("Short text.", 50)).toBe("Short text.");
    expect(excerpt("  lots   of \n space  ", 50)).toBe("lots of space");
    const long = "The association hosts a careers panel for economics and finance students every year at the main campus";
    const e = excerpt(long, 40);
    expect(e.endsWith("…")).toBe(true);
    expect(e.length).toBeLessThanOrEqual(41);
    expect(long.startsWith(e.slice(0, -1))).toBe(true);
    expect(excerpt(null)).toBe("");
  });
  it("splits events into upcoming (soonest first) and past (latest first)", () => {
    const ev = (id: string, s: string, e: string | null = null) => ({ id, starts_at: s, ends_at: e });
    const { upcoming, past } = partitionEvents(
      [ev("late", "2026-12-20T10:00:00Z"), ev("soon", "2026-11-20T10:00:00Z"), ev("old", "2026-09-01T10:00:00Z"), ev("older", "2026-08-01T10:00:00Z"), ev("running", "2026-11-12T08:00:00Z", "2026-11-12T12:00:00Z")],
      now,
    );
    expect(upcoming.map((e) => e.id)).toEqual(["running", "soon", "late"]);
    expect(past.map((e) => e.id)).toEqual(["old", "older"]);
    expect(hasEnded({ starts_at: "2026-11-12T08:00:00Z", ends_at: null }, now)).toBe(true);
  });
  it("lists an opportunity until its deadline passes, and always when it has none", () => {
    expect(isOpenOpportunity({ deadline: null }, now)).toBe(true);
    expect(isOpenOpportunity({ deadline: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(isOpenOpportunity({ deadline: "2026-11-01T00:00:00Z" }, now)).toBe(false);
  });
  it("only ever produces web links", () => {
    expect(safeWebUrl("https://example.org/a")).toBe("https://example.org/a");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://x.test", "//evil.test", "example.org", "", null, undefined]) expect(safeWebUrl(bad)).toBeNull();
  });
});

describe("date helpers", () => {
  it("formats in Nairobi time", () => {
    // 14:00 +03:00 must display as 14:00 (Nairobi, 24-hour), not shifted to UTC (11:00)
    expect(formatEventDate("2026-12-04T14:00:00+03:00")).toMatch(/4 December 2026/);
    expect(formatEventDate("2026-12-04T14:00:00+03:00")).toMatch(/14:00/);
  });
  it("splits day and month", () => {
    expect(dateParts("2026-12-04T14:00:00+03:00")).toEqual({ day: "4", month: "Dec" });
  });
});
