import { describe, expect, it } from "vitest";
import { roleBadgeLabels, userRoles } from "@/lib/auth/roles";
import { hasActiveMembership } from "@/lib/member/queries";
import { read, srcFiles, walk } from "./support-fs";

const src = srcFiles().map((f) => ({ f, text: read(f) }));

// ---- routes that exist, built from the folder layout (route groups like (public) are not part of the address)
const routeFiles = [...walk("src/app", ["page.tsx"]), ...walk("src/app", ["route.ts"])];
const routePatterns = routeFiles.map((f) => {
  const segs = f
    .replace(/^src\/app\/?/, "")
    .replace(/\/?(page\.tsx|route\.ts)$/, "")
    .split("/")
    .filter((s) => s && !/^\(.*\)$/.test(s))
    .map((s) => (/^\[.+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  return new RegExp(`^/${segs.join("/")}$`.replace(/\/$/, "") || "^/$");
});
/** True when the position sits inside a <label> that has not been closed yet (an implicit label). */
const insideLabel = (text: string, index: number) => /<label\b[^>]*>(?![\s\S]*<\/label>)/.test(text.slice(Math.max(0, index - 300), index));

const routeExists = (path: string) => (path === "/" ? routeFiles.some((f) => /^src\/app\/(\([^)]*\)\/)?page\.tsx$/.test(f)) : routePatterns.some((r) => r.test(path)));

describe("navigation", () => {
  const found = new Map<string, string[]>();
  for (const { f, text } of src) {
    for (const m of text.matchAll(/(?:href=|href: |redirect\(|router\.push\(|\bnext=)\s*\{?["'](\/[^"'`$]*)["']/g)) {
      const path = m[1].split("?")[0].split("#")[0] || "/";
      found.set(path, [...(found.get(path) ?? []), f]);
    }
  }
  it("found a meaningful number of internal links", () => expect(found.size).toBeGreaterThan(30));
  it("every fixed internal link points to a page that exists", () => {
    const missing = [...found.keys()].filter((p) => !routeExists(p)).map((p) => `${p}  (used in ${found.get(p)![0]})`);
    expect(missing).toEqual([]);
  });
  it("knows the pages added in later phases", () => {
    for (const p of ["/verify", "/verify/0123456789abcdef0123456789abcdef", "/research/some-slug", "/dashboard/research", "/admin/analytics", "/admin/events/abc", "/auth/confirm"]) expect(routeExists(p)).toBe(true);
    expect(routeExists("/admin/nothing-here")).toBe(false);
  });
});

describe("accessibility basics", () => {
  const pages = walk("src/app", ["page.tsx"]).map((f) => ({ f, text: read(f) }));
  const HEADING_SOURCES = /PageHeader|PageTitle|AuthCard|ContentListPage|ContentNewPage|ContentEditPage|<h1\b/;
  it("every page has a main heading", () => {
    expect(pages.filter(({ text }) => !HEADING_SOURCES.test(text)).map((p) => p.f)).toEqual([]);
  });
  it("no page declares two main headings", () => {
    expect(pages.filter(({ text }) => (text.match(/<h1\b/g) ?? []).length > 1).map((p) => p.f)).toEqual([]);
  });
  it("the shared heading components really render an h1", () => {
    for (const f of ["src/components/public/page-header.tsx", "src/components/dashboard/page-title.tsx", "src/components/auth/auth-card.tsx"]) expect(read(f)).toMatch(/<h1\b/);
  });
  it("every form control outside the shared field components is labelled", () => {
    const bad: string[] = [];
    for (const { f, text } of src.filter((s) => !s.f.startsWith("src/components/ui/"))) {
      for (const m of text.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)) {
        const tag = m[0];
        if (/type="hidden"/.test(tag) || /\bid=/.test(tag) || /aria-label/.test(tag) || insideLabel(text, m.index!)) continue;
        bad.push(`${f}: ${tag.slice(0, 70)}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it("checkboxes sit inside a label", () => {
    for (const { f, text } of src) {
      for (const m of text.matchAll(/<input\b[^>]*type="checkbox"[^>]*>/g)) {
        expect(`${f}: ${insideLabel(text, m.index!)}`).toBe(`${f}: true`);
      }
    }
  });
  it("the page language is set and the skip link exists", () => {
    expect(read("src/app/layout.tsx")).toContain('lang="en"');
    expect(read("src/components/layout/public-shell.tsx")).toContain("Skip to content");
  });
  it("images always have alternative text", () => {
    for (const { f, text } of src) for (const tag of text.match(/<img\b[^>]*>/g) ?? []) expect(`${f}: ${tag}`).toMatch(/\balt=/);
  });
});

describe("error handling", () => {
  it("has friendly error pages and a not-found page", () => {
    for (const f of ["src/app/error.tsx", "src/app/global-error.tsx", "src/app/not-found.tsx"]) expect(read(f).length).toBeGreaterThan(100);
  });
  it("error pages never print the technical message to visitors", () => {
    for (const f of ["src/app/error.tsx", "src/app/global-error.tsx"]) expect(read(f)).not.toMatch(/\{error\.message\}|\{error\.stack\}/);
  });
  it("private areas are kept out of search engines", () => {
    const r = read("src/app/robots.ts");
    for (const p of ["/admin", "/dashboard", "/verify"]) expect(r).toContain(`"${p}"`);
  });
});

describe("master admin and session status", () => {
  it("every role has a short status label, and the super administrator reads Master Admin", () => {
    for (const r of userRoles) expect(roleBadgeLabels[r].length).toBeGreaterThan(2);
    expect(roleBadgeLabels.super_admin).toBe("Master Admin");
    expect(roleBadgeLabels.treasurer).toBe("Treasurer");
    expect(roleBadgeLabels.member).toBe("Member");
  });
  it("the Master Admin counts as an approved member without any membership row", () => {
    const today = new Date("2026-11-12T10:00:00Z");
    expect(hasActiveMembership([], today, "super_admin")).toBe(true);
  });
  it("nobody else gets that shortcut", () => {
    const today = new Date("2026-11-12T10:00:00Z");
    for (const r of userRoles.filter((x) => x !== "super_admin")) expect(hasActiveMembership([], today, r)).toBe(false);
    expect(hasActiveMembership([], today)).toBe(false);
  });
  it("the status bar is shown on every page that uses the shared shell, and only to signed-in people", () => {
    const shell = read("src/components/layout/public-shell.tsx");
    expect(shell).toContain("<SessionBar />");
    expect(shell).toContain("<AuthProvider>");
    expect(read("src/components/layout/session-bar.tsx")).toMatch(/auth\.status !== "in"\) return null/);
  });
  it("the login page sends a person who is already signed in on their way, without risking a redirect loop", () => {
    const login = read("src/app/(auth)/login/page.tsx");
    expect(login).toMatch(/!error && isSupabaseConfigured\(\) && \(await getCurrentUser\(\)\)\) redirect\(safeNext\(next\)\)/);
  });
});
