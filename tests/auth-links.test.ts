import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(f, "utf8");

describe("email links (sign-up confirmation and password reset)", () => {
  const route = read("src/app/auth/confirm/route.ts");
  const actions = read("src/lib/auth/actions.ts");
  const proxy = read("src/proxy.ts");

  it("the confirm route accepts both token_hash links and ?code= links", () => {
    expect(route).toContain("verifyOtp");
    expect(route).toContain("exchangeCodeForSession");
  });
  it("sign-up confirmation ends on the Email verified page and reset links on the new-password page", () => {
    expect(route).toContain('"/auth/verified"');
    expect(route).toContain('"/reset-password/update"');
    expect(read("src/app/auth/verified/page.tsx")).toContain("Email verified");
  });
  it("sign-up and reset emails carry an explicit redirect to the confirm route", () => {
    expect(actions).toMatch(/emailRedirectTo: `\$\{origin\}\/auth\/confirm/);
    expect(actions).toMatch(/redirectTo: `\$\{origin\}\/auth\/confirm/);
  });
  it("email links that land on the home page are forwarded instead of ignored", () => {
    expect(proxy).toMatch(/searchParams\.has\("code"\)/);
    expect(proxy).toMatch(/matcher: \["\/",/);
  });
});
