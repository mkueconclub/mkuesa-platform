import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Reads the real tokens from globals.css so tests can never drift from the UI.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const tokens: Record<string, string> = {};
for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)) tokens[m[1]] = m[2];
tokens.white = "#ffffff";

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg: string, bg: string) => {
  const [a, b] = [luminance(tokens[fg]), luminance(tokens[bg])].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

// [foreground, background, minimum ratio, where it is used]
const pairs: Array<[string, string, number, string]> = [
  ["ink", "ivory", 7, "body text on page background"],
  ["ink", "paper", 7, "body text on cards"],
  ["muted", "ivory", 4.5, "secondary text on page background"],
  ["muted", "paper", 4.5, "secondary text on cards"],
  ["brand-700", "ivory", 4.5, "links and active nav"],
  ["brand-700", "paper", 4.5, "outline buttons"],
  ["brand-800", "brand-50", 4.5, "brand badge"],
  ["white", "brand-700", 4.5, "primary button"],
  ["white", "brand-800", 4.5, "primary button hover"],
  ["white", "brand-900", 4.5, "skip link"],
  ["ink", "accent-500", 4.5, "accent button"],
  ["ink", "accent-400", 4.5, "accent button hover"],
  ["accent-700", "ivory", 4.5, "eyebrow text on light"],
  ["accent-700", "paper", 4.5, "eyebrow text on cards"],
  ["accent-800", "accent-100", 4.5, "accent badge"],
  ["ivory", "brand-950", 7, "text on dark sections"],
  ["brand-100", "brand-950", 7, "secondary text on dark sections"],
  ["brand-200", "brand-950", 4.5, "footer small print"],
  ["accent-400", "brand-950", 4.5, "eyebrow text on dark"],
  ["white", "brand-950", 7, "headings on dark"],
  ["accent-800", "accent-50", 4.5, "sample-content notice"],
  ["brand-900", "paper", 7, "card titles"],
  ["brand-900", "ivory", 7, "headings on ivory"],
  ["slate", "paper", 4.5, "input placeholder text"],
  ["white", "brand-800", 4.5, "event date block"],
  ["ink", "accent-500", 4.5, "membership call-to-action band"],
];

describe("WCAG AA colour contrast", () => {
  it("parsed the design tokens", () => {
    expect(Object.keys(tokens).length).toBeGreaterThan(20);
  });
  it.each(pairs)("%s on %s is at least %d:1 (%s)", (fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
  it("documents that logo orange is NOT usable as text on light backgrounds", () => {
    expect(ratio("accent-500", "paper")).toBeLessThan(4.5);
  });
});
