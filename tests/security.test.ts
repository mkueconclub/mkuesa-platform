import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { cleanSearchQuery } from "@/lib/admin/search";
import { safeNext } from "@/lib/auth/redirect";
import { read, root, sqlFiles, srcFiles, walk } from "./support-fs";

const src = srcFiles().map((f) => ({ f, text: read(f) }));
const allSql = sqlFiles().map((f) => ({ f, text: read(f) }));

describe("secrets", () => {
  it("no key, token or service-role reference appears in the source", () => {
    const bad = src.filter(({ text }) => /sb_secret_|service_role|SERVICE_ROLE|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(text)).map((x) => x.f);
    expect(bad).toEqual([]);
  });
  it("only publishable values are exposed to the browser", () => {
    const names = new Set(src.flatMap(({ text }) => [...text.matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)].map((m) => m[1])));
    for (const n of names) expect(n).not.toMatch(/SECRET|SERVICE|PRIVATE|PASSWORD|TOKEN/);
  });
  it(".env.example holds no real values", () => {
    const lines = read(".env.example").split("\n").filter((l) => /^[A-Z_]+=/.test(l));
    for (const l of lines) {
      const [k, v] = l.split("=");
      if (k !== "NEXT_PUBLIC_SITE_URL") expect(v.trim()).toBe("");
    }
  });
  it(".gitignore keeps local environment files out of git", () => {
    const g = read(".gitignore");
    expect(g).toMatch(/^\.env\.local$/m);
    expect(g).toMatch(/^\.env$/m);
  });
});

describe("cross-site scripting", () => {
  it("never inserts raw HTML or runs strings as code", () => {
    const bad = src.filter(({ text }) => /dangerouslySetInnerHTML|\.innerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/.test(text)).map((x) => x.f);
    expect(bad).toEqual([]);
  });
  it("opens new tabs safely", () => {
    for (const { f, text } of src) {
      for (const tag of text.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? []) expect(`${f}: ${tag}`).toMatch(/rel="[^"]*noopener[^"]*"/);
    }
  });
});

describe("server and client separation", () => {
  const serverOnly = ["@/lib/supabase/server", "@/lib/supabase/public", "@/lib/auth/session", "server-only", "next/headers"];
  it("client components never import server-only code", () => {
    const offenders = src
      .filter(({ text }) => /^\s*["']use client["']/.test(text))
      .filter(({ text }) => serverOnly.some((m) => new RegExp(`from ["']${m}["']|import ["']${m}["']`).test(text)))
      .map((x) => x.f);
    expect(offenders).toEqual([]);
  });
  it("modules that hold the session helpers are marked server-only", () => {
    expect(read("src/lib/auth/session.ts")).toContain('import "server-only"');
    expect(read("src/lib/supabase/public.ts")).toContain('import "server-only"');
  });
  it('"use server" files export only async functions or types', () => {
    for (const { f, text } of src.filter(({ text }) => /^\s*["']use server["']/.test(text))) {
      const bad = (text.match(/^export (?!async function|type |\{ ?type|type\b)[^\n]*/gm) ?? []).filter((l) => !l.startsWith("export type"));
      expect({ f, bad }).toEqual({ f, bad: [] });
    }
  });
});

// Actions that are open to visitors on purpose (everything else must check who is calling).
const PUBLIC_ACTIONS = new Set(["registerAction", "loginAction", "logoutAction", "requestPasswordResetAction", "submitContactAction", "sendExecutiveMessageAction"]);
const GUARDS = ["requireProfile(", "requireUser(", "getCurrentUser(", "auth.getUser("];

describe("server actions check who is calling", () => {
  const actionFiles = src.filter(({ f, text }) => /actions\.ts$/.test(f) && /^\s*["']use server["']/.test(text));
  it("found the action files", () => expect(actionFiles.length).toBeGreaterThanOrEqual(3));
  for (const { f, text } of actionFiles) {
    const parts = text.split(/^export async function /m).slice(1);
    for (const part of parts) {
      const name = part.slice(0, part.indexOf("("));
      it(`${f.replace("src/lib/", "")}: ${name}`, () => {
        if (PUBLIC_ACTIONS.has(name)) return;
        expect(GUARDS.some((g) => part.includes(g))).toBe(true);
      });
    }
  }
  it("every admin action also checks the role before writing", () => {
    const admin = read("src/lib/admin/actions.ts");
    for (const part of admin.split(/^export async function /m).slice(1)) {
      expect(part).toMatch(/requireProfile\(/);
      expect(part).toMatch(/FORBIDDEN|contentPermissions|can\./);
    }
  });
});

describe("protected route handlers", () => {
  // Route handlers (for example the announcement poster download) are not pages, so they need their own check.
  it("every route handler under /admin and /dashboard checks the caller's role before doing anything", () => {
    const routes = [...walk("src/app/admin", ["route.ts"]), ...walk("src/app/dashboard", ["route.ts"])];
    expect(routes.length).toBeGreaterThanOrEqual(1);
    for (const r of routes) expect(read(r)).toMatch(/requireRole\(|requireProfile\(/);
  });
  it("the poster download is limited to the officers who may sign posters, and never trusts the request for the signature", () => {
    const route = read("src/app/admin/announcements/[id]/poster/route.ts");
    expect(route).toMatch(/requireRole\(posterSignerRoles/);
    expect(route).toMatch(/signer: \{ name: profile\.full_name, title: roleLabels\[profile\.role\] \}/);
    expect(route).toContain('"Cache-Control": "private, no-store"');
  });
});

describe("protected pages", () => {
  const GUARD = /requireProfile|requireRole|requireUser|ContentListPage|ContentNewPage|ContentEditPage/;
  it("every dashboard and admin page re-checks access itself, not only the layout", () => {
    const pages = [...walk("src/app/dashboard", ["page.tsx"]), ...walk("src/app/admin", ["page.tsx"])];
    expect(pages.length).toBeGreaterThan(20);
    expect(pages.filter((p) => !GUARD.test(read(p)))).toEqual([]);
  });
  it("the admin layout allows staff roles only and the proxy covers both areas", () => {
    expect(read("src/app/admin/layout.tsx")).toMatch(/requireRole\(staffRoles/);
    const proxy = read("src/proxy.ts");
    expect(proxy).toContain("/dashboard/:path*");
    expect(proxy).toContain("/admin/:path*");
  });
});

describe("redirects and search input", () => {
  it.each(["/\t/evil.test", "/\r\n/evil.test", "////evil.test", "/\\/evil.test", "https:evil.test", "mailto:a@b.c", "data:text/html,x", " //evil.test", "/\u0000/x"])("safeNext rejects %j", (v) => {
    expect(safeNext(v)).toBe("/dashboard");
  });
  it("safeNext keeps ordinary in-site paths", () => {
    for (const p of ["/dashboard/events", "/admin/members?page=2", "/events/budget-debate"]) expect(safeNext(p)).toBe(p);
  });
  it("cleanSearchQuery removes everything that could alter a filter", () => {
    for (const evil of ["a,role.eq.super_admin", "x),(role.eq.super_admin", "%", "*", "a;b", "a'b", 'a"b', "a\\b", "a/b", "(a)", "a:b", "<script>"]) {
      expect(cleanSearchQuery(evil)).not.toMatch(/[,()%*;'"\\/:<>]/);
    }
    expect(cleanSearchQuery("amina.otieno@mku.ac.ke")).toBe("amina.otieno@mku.ac.ke");
    expect(cleanSearchQuery("Wanjiru Mwangi")).toBe("Wanjiru Mwangi");
    expect(cleanSearchQuery("x".repeat(500)).length).toBe(60);
    expect(cleanSearchQuery(undefined)).toBe("");
  });
});

describe("browser protections", () => {
  async function headers() {
    const rules = await nextConfig.headers!();
    return Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));
  }
  it("sends the expected security headers on every page", async () => {
    const h = await headers();
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d{7,}/);
    expect(h["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });
  it("forbids framing, plugins and foreign form targets", async () => {
    const csp = (await headers())["Content-Security-Policy"];
    for (const d of ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"]) expect(csp).toContain(d);
  });
  it("does not advertise the framework", () => expect(nextConfig.poweredByHeader).toBe(false));
  it("keeps the session cookie persistent, lax and HTTPS-only in production", () => {
    const c = read("src/lib/supabase/cookies.ts");
    expect(c).toMatch(/sameSite: "lax"/);
    expect(c).toMatch(/secure: process\.env\.NODE_ENV === "production"/);
    expect(c).toMatch(/maxAge: 60 \* 60 \* 24 \* 400/);
    for (const f of ["server", "proxy", "client"]) expect(read(`src/lib/supabase/${f}.ts`)).toContain("authCookieOptions");
  });
});

describe("database safety (all migrations)", () => {
  it("every SECURITY DEFINER function pins its search path", () => {
    const missing: string[] = [];
    for (const { f, text } of allSql) {
      for (const m of text.matchAll(/create (?:or replace )?function[\s\S]*?\$\$/g)) {
        if (/security definer/i.test(m[0]) && !/set search_path = ''/i.test(m[0])) missing.push(`${f}: ${m[0].slice(0, 60)}`);
      }
    }
    expect(missing).toEqual([]);
  });
  it("row level security is on for every table in the public schema", () => {
    const all = allSql.map((x) => x.text).join("\n");
    const tables = [...all.matchAll(/create table public\.([a-z_]+)/g)].map((m) => m[1]);
    expect(tables.length).toBe(12);
    for (const t of tables) expect(all).toMatch(new RegExp(`alter table public\\.${t} enable row level security`));
  });
  it("visitors (anon) are only ever granted read access to tables", () => {
    for (const { text } of allSql) {
      for (const m of text.matchAll(/grant ([^;]*?) (?:on|to) [^;]*\bto anon\b[^;]*;/gi)) {
        if (/function/i.test(m[0])) continue;
        expect(m[0]).toMatch(/grant select/i);
      }
    }
  });
  it("the contact form is throttled in the database", () => {
    const f = allSql.find((x) => x.text.includes("create function public.submit_contact_message"))!.text;
    expect(f).toContain("rate_limited");
    expect(f).toMatch(/interval '1 hour'/);
  });
  it("the master admin bypass is limited to the super administrator", () => {
    const f = allSql.find((x) => x.f.includes("master_admin"))!.text;
    expect(f).toMatch(/array\['super_admin'\]/);
    expect(f).not.toMatch(/chairperson|secretary|treasurer|vice_chairperson|membership_coordinator|content_editor/);
  });
  it("is checked against the real project root", () => expect(root.length).toBeGreaterThan(1));
});
