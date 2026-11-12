import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentConfigs } from "@/lib/admin/content-config";
import { parseContent, slugify } from "@/lib/admin/content-payload";
import { adminNavFor, can, contentMatrix, contentPermissions, contentTable, type ContentKind } from "@/lib/auth/permissions";
import { userRoles } from "@/lib/auth/roles";
import { fromNairobiInput, toNairobiInput } from "@/lib/utils/date";

const dir = join(process.cwd(), "supabase/migrations");
const sql = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(dir, f), "utf8")).join("\n");

describe("permissions mirror the database", () => {
  it("content matrix equals the cfg in the RLS migration", () => {
    const m = sql.match(/cfg jsonb := '(\{[\s\S]*?\})';/);
    expect(m).toBeTruthy();
    const cfg = JSON.parse(m![1]) as Record<string, { full: string[]; cru: string[]; draft: string[] }>;
    for (const kind of Object.keys(contentMatrix) as Exclude<ContentKind, "committee">[]) {
      expect(cfg[contentTable[kind]]).toEqual(contentMatrix[kind]);
    }
    expect(Object.keys(cfg).sort()).toEqual(Object.keys(contentMatrix).map((k) => contentTable[k as ContentKind]).sort());
  });

  it("every field of every content type is a real column in the schema", () => {
    for (const cfg of Object.values(contentConfigs)) {
      const block = sql.match(new RegExp(`create table public\\.${cfg.table} \\(([\\s\\S]*?)\\n\\);`));
      expect(block).toBeTruthy();
      for (const f of cfg.fields) expect(new RegExp(`^\\s*${f.name}\\s`, "m").test(block![1])).toBe(true);
      if (cfg.hasSlug) expect(block![1]).toContain("slug");
    }
  });

  it("applies the role rules the interface depends on", () => {
    expect(contentPermissions("announcements", "content_editor")).toEqual({ read: true, write: true, delete: false, draftOnly: true });
    expect(contentPermissions("events", "content_editor")).toMatchObject({ write: true, delete: false, draftOnly: false });
    expect(contentPermissions("events", "secretary")).toMatchObject({ write: true, delete: true });
    expect(contentPermissions("resources", "vice_chairperson")).toMatchObject({ write: true, delete: false });
    expect(contentPermissions("resources", "treasurer")).toMatchObject({ read: true, write: false, delete: false });
    expect(contentPermissions("committee", "secretary")).toMatchObject({ write: true, delete: false });
    expect(contentPermissions("committee", "super_admin")).toMatchObject({ write: true, delete: true });
    expect(contentPermissions("committee", "membership_coordinator")).toMatchObject({ write: false });
  });

  it("members get no administration access at all", () => {
    for (const kind of Object.keys(contentConfigs) as ContentKind[]) expect(contentPermissions(kind, "member")).toEqual({ read: false, write: false, delete: false, draftOnly: false });
    expect(adminNavFor("member").length).toBeGreaterThan(0); // never rendered for members: the layout redirects them first
    for (const check of Object.values(can)) expect(check("member")).toBe(false);
  });

  it("only the right roles review applications, change roles and revoke certificates", () => {
    expect(userRoles.filter(can.reviewApplications).sort()).toEqual(["chairperson", "membership_coordinator", "super_admin"]);
    expect(userRoles.filter(can.changeRoles)).toEqual(["super_admin"]);
    expect(userRoles.filter(can.revokeCertificates).sort()).toEqual(["chairperson", "super_admin"]);
  });

  it("shows each role only the sections it can use", () => {
    const hrefs = (r: Parameters<typeof adminNavFor>[0]) => adminNavFor(r).map((i) => i.href);
    expect(hrefs("content_editor")).not.toContain("/admin/members");
    expect(hrefs("content_editor")).not.toContain("/admin/certificates");
    expect(hrefs("content_editor")).not.toContain("/admin/audit");
    expect(hrefs("membership_coordinator")).toContain("/admin/members/applications");
    expect(hrefs("membership_coordinator")).not.toContain("/admin/audit");
    expect(hrefs("treasurer")).toContain("/admin/certificates");
    expect(hrefs("super_admin")).toContain("/admin/audit");
    expect(hrefs("super_admin")).toContain("/admin/messages");
  });
});

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};
const event = { title: "Budget Debate", description: "Debate the national budget.", location: "Room 4", starts_at: "2026-12-01T14:00", ends_at: "2026-12-01T16:00", capacity: "50", registration_required: "on", registration_deadline: "", visibility: "public", status: "published" };

describe("parseContent", () => {
  it("builds a database row from a valid event form", () => {
    const r = parseContent(contentConfigs.events, form(event));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.starts_at).toBe("2026-12-01T11:00:00.000Z"); // 14:00 Nairobi = 11:00 UTC
      expect(r.data.capacity).toBe(50);
      expect(r.data.registration_required).toBe(true);
      expect(r.data.registration_deadline).toBeNull();
      expect(r.data).not.toHaveProperty("created_by");
      expect(r.data).not.toHaveProperty("slug");
    }
  });
  it("rejects missing, malformed and out-of-range values with field errors", () => {
    const r = parseContent(contentConfigs.events, form({ ...event, title: "Hi", starts_at: "", capacity: "0", visibility: "secret" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["capacity", "starts_at", "title", "visibility"]);
  });
  it("rejects an event that ends before it starts", () => {
    const r = parseContent(contentConfigs.events, form({ ...event, ends_at: "2026-12-01T13:00" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveProperty("ends_at");
  });
  it("lets draft-only editors save only drafts", () => {
    expect(parseContent(contentConfigs.announcements, form({ title: "Welcome", body: "Hello all", visibility: "public", status: "published" }), { allowedStatuses: ["draft"] }).ok).toBe(false);
    expect(parseContent(contentConfigs.announcements, form({ title: "Welcome", body: "Hello all", visibility: "public", status: "draft" }), { allowedStatuses: ["draft"] }).ok).toBe(true);
  });
  it("only accepts http(s) links", () => {
    const base = { title: "Intro to Macro", description: "", category: "economics", kind: "link", tags: "", visibility: "members", status: "draft" };
    for (const bad of ["javascript:alert(1)", "ftp://x.test/a", "not a url", ""]) expect(parseContent(contentConfigs.resources, form({ ...base, external_url: bad })).ok).toBe(false);
    expect(parseContent(contentConfigs.resources, form({ ...base, external_url: "https://example.org/a" })).ok).toBe(true);
  });
  it("cleans and limits tags", () => {
    const base = { title: "Intro to Macro", description: "", category: "economics", kind: "link", external_url: "https://example.org", visibility: "members", status: "draft" };
    const r = parseContent(contentConfigs.resources, form({ ...base, tags: " macro, micro ,macro,," }));
    expect(r.ok && r.data.tags).toEqual(["macro", "micro"]);
    expect(parseContent(contentConfigs.resources, form({ ...base, tags: Array.from({ length: 16 }, (_, i) => `t${i}`).join(",") })).ok).toBe(false);
  });
  it("validates committee entries, including consent as a checkbox", () => {
    const r = parseContent(contentConfigs.committee, form({ display_name: "A Person", position_title: "Chairperson", bio: "", term_label: "2026/2027", display_order: "1", is_current: "on" }));
    expect(r.ok && r.data.public_consent).toBe(false);
    expect(r.ok && r.data.is_current).toBe(true);
  });
  it("cannot be tricked into writing columns that are not part of the form", () => {
    const r = parseContent(contentConfigs.announcements, form({ title: "Welcome", body: "Hello all", visibility: "public", status: "draft", created_by: "someone", role: "super_admin" }));
    expect(r.ok && Object.keys(r.data).sort()).toEqual(["body", "is_pinned", "status", "title", "visibility"]);
  });
});

describe("slugify", () => {
  it("makes slugs the database accepts", () => {
    const re = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const t of ["Budget Debate 2026!", "  Économie & Finance  ", "---", "日本語", "a".repeat(300)]) expect(re.test(slugify(t))).toBe(true);
    expect(slugify("Budget Debate 2026!")).toBe("budget-debate-2026");
    expect(slugify("Économie & Finance")).toBe("economie-finance");
    expect(slugify("a".repeat(300)).length).toBeLessThanOrEqual(80);
  });
});

describe("Nairobi time helpers", () => {
  it("round-trips a form value", () => {
    expect(fromNairobiInput("2026-12-01T14:00")).toBe("2026-12-01T11:00:00.000Z");
    expect(toNairobiInput("2026-12-01T11:00:00.000Z")).toBe("2026-12-01T14:00");
    expect(toNairobiInput(fromNairobiInput("2026-03-05T00:30"))).toBe("2026-03-05T00:30");
  });
  it("handles empty and invalid input", () => {
    expect(fromNairobiInput("")).toBeNull();
    expect(fromNairobiInput("tomorrow")).toBeNull();
    expect(fromNairobiInput("2026-13-45T99:99")).toBeNull();
    expect(toNairobiInput(null)).toBe("");
    expect(toNairobiInput("garbage")).toBe("");
  });
});
