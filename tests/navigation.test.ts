import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { footerGroups, mainNav, memberActions } from "@/config/site";

const hrefs = [
  ...mainNav.map((n) => n.href),
  memberActions.login.href,
  memberActions.join.href,
  ...footerGroups.flatMap((g) => g.links.map((l) => l.href)),
];

// Route groups such as (public) and (auth) don't appear in the URL.
const hasPage = (href: string) =>
  ["(public)", "(auth)", ""].some((group) => existsSync(join(process.cwd(), "src/app", group, href, "page.tsx")));

describe("navigation", () => {
  it("uses unique main navigation links", () => {
    const list = mainNav.map((n) => n.href);
    expect(new Set(list).size).toBe(list.length);
  });
  it("only links to internal, absolute paths", () => {
    for (const href of hrefs) expect(href).toMatch(/^\/[a-z-]*$/);
  });
  it("never links to a page that does not exist", () => {
    const missing = [...new Set(hrefs)].filter((h) => !hasPage(h));
    expect(missing).toEqual([]);
  });
});
