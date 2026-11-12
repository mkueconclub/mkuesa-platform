import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAnalytics } from "@/lib/admin/analytics";
import { adminNavFor, can } from "@/lib/auth/permissions";
import { userRoles } from "@/lib/auth/roles";
import { formatVerificationCode, normalizeVerificationCode } from "@/lib/certificates";
import { monthLabel, niceMax, percent, ticks } from "@/lib/charts/scale";
import { researchSchema } from "@/lib/validation/member";
import { fieldErrors } from "@/lib/validation/auth";

const CODE = "0123456789abcdef0123456789abcdef";

describe("certificate codes", () => {
  it("accepts a 32-character hex code in any case and ignores surrounding spaces", () => {
    expect(normalizeVerificationCode(CODE)).toBe(CODE);
    expect(normalizeVerificationCode(`  ${CODE.toUpperCase()}  `)).toBe(CODE);
  });
  it.each(["", "short", `${CODE}0`, CODE.slice(1), `${CODE.slice(0, 31)}g`, "../../etc/passwd", `${CODE}'; drop table certificates;--`])("rejects %j", (bad) => {
    expect(normalizeVerificationCode(bad)).toBeNull();
  });
  it("handles null and undefined", () => {
    expect(normalizeVerificationCode(null)).toBeNull();
    expect(normalizeVerificationCode(undefined)).toBeNull();
  });
  it("groups a code for reading", () => expect(formatVerificationCode(CODE)).toBe("01234567 89abcdef 01234567 89abcdef"));
});

describe("chart scale", () => {
  it("rounds an axis maximum up to 1, 2, 5 or 10 times a power of ten", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(11)).toBe(20);
    expect(niceMax(130)).toBe(200);
    expect(niceMax(999)).toBe(1000);
    expect(niceMax(Number.NaN)).toBe(1);
  });
  it("never returns a maximum below the data", () => {
    for (const v of [1, 2, 3, 4, 5, 6, 9, 10, 11, 49, 51, 99, 101, 1234]) expect(niceMax(v)).toBeGreaterThanOrEqual(v);
  });
  it("builds evenly spaced ticks from zero", () => expect(ticks(7)).toEqual([0, 2.5, 5, 7.5, 10]));
  it("formats month labels", () => {
    expect(monthLabel("2026-11")).toBe("Nov 26");
    expect(monthLabel("2027-01")).toBe("Jan 27");
    expect(monthLabel("garbage")).toBe("garbage");
    expect(monthLabel("2026-13")).toBe("2026-13");
  });
  it("computes whole percentages without dividing by zero", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
    expect(percent(5, 0)).toBe(0);
  });
});

const good = {
  applications_by_month: [{ month: "2026-11", applied: 4, approved: "2" }],
  events: [{ title: "Budget Debate", starts_at: "2026-10-01T10:00:00Z", capacity: null, signed_up: 10, attended: 7, waitlisted: 0 }],
  members_by_year: [{ label: "Year 1", count: 12 }],
  programmes: [{ label: "BA Economics", count: 9 }],
};

describe("parseAnalytics", () => {
  it("accepts what the database returns, including numbers sent as text", () => {
    const a = parseAnalytics(good);
    expect(a?.applications_by_month[0].approved).toBe(2);
    expect(a?.events[0].capacity).toBeNull();
  });
  it("returns null instead of throwing on a bad shape", () => {
    expect(parseAnalytics(null)).toBeNull();
    expect(parseAnalytics({})).toBeNull();
    expect(parseAnalytics({ ...good, events: "nope" })).toBeNull();
    expect(parseAnalytics({ ...good, programmes: [{ label: "x", count: -1 }] })).toBeNull();
  });
});

describe("researchSchema", () => {
  const ok = { title: "Inflation and food prices", authorName: "Amina Otieno", abstract: "x".repeat(60), body: "" };
  it("accepts a valid submission and treats an empty body as absent", () => {
    const r = researchSchema.safeParse(ok);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.body).toBeUndefined();
  });
  it.each([
    ["short title", { title: "ab" }, "title"],
    ["missing author", { authorName: "" }, "authorName"],
    ["short abstract", { abstract: "too short" }, "abstract"],
    ["huge abstract", { abstract: "x".repeat(3001) }, "abstract"],
    ["huge body", { body: "x".repeat(100001) }, "body"],
  ])("rejects %s", (_n, override, field) => {
    const r = researchSchema.safeParse({ ...ok, ...override });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error))).toContain(field);
  });
  it("ignores fields a member must never set", () => {
    const r = researchSchema.safeParse({ ...ok, status: "published", author_id: "x", type: "article", reviewed_by: "y" });
    expect(r.success).toBe(true);
    if (r.success) expect(Object.keys(r.data).sort()).toEqual(["abstract", "authorName", "body", "title"]);
  });
});

describe("analytics access", () => {
  it("is limited to the roles that may already read member data", () => {
    expect(userRoles.filter(can.readAnalytics).sort()).toEqual(["chairperson", "membership_coordinator", "secretary", "super_admin", "vice_chairperson"]);
    expect(adminNavFor("membership_coordinator").map((i) => i.href)).toContain("/admin/analytics");
    expect(adminNavFor("treasurer").map((i) => i.href)).not.toContain("/admin/analytics");
    expect(adminNavFor("content_editor").map((i) => i.href)).not.toContain("/admin/analytics");
  });
});

const dir = join(process.cwd(), "supabase/migrations");
const phase6 = readFileSync(join(dir, readdirSync(dir).filter((f) => f.includes("phase6")).sort()[0]), "utf8");

describe("phase 6 migration safety", () => {
  it("pins the search path on every SECURITY DEFINER function", () => {
    const defs = phase6.match(/create function[\s\S]*?\$\$/g) ?? [];
    expect(defs.length).toBeGreaterThanOrEqual(3);
    for (const d of defs) if (/security definer/i.test(d)) expect(d).toMatch(/set search_path = ''/);
  });
  it("exposes only the intended functions to visitors", () => {
    expect(phase6).toMatch(/grant execute on function public\.verify_certificate\(text\) to anon, authenticated/);
    expect(phase6).toMatch(/revoke all on function public\.admin_analytics\(\) from public, anon/);
    expect(phase6).not.toMatch(/grant execute on function public\.admin_analytics\(\) to anon/);
    expect(phase6).toMatch(/revoke all on function private\.limit_pending_submissions\(\) from public, anon, authenticated/);
  });
  it("never returns an email, id or revocation reason from the public verification function", () => {
    const fn = phase6.match(/create function public\.verify_certificate[\s\S]*?end \$\$;/)![0];
    const returns = fn.match(/returns table \(([^)]*)\)/)![1];
    expect(returns).not.toMatch(/email|\bid\b|reason|profile_id/);
  });
  it("adds no tables", () => expect(phase6).not.toMatch(/create table/i));
});
