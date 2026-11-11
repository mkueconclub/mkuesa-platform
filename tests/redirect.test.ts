import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/redirect";

describe("safeNext (open-redirect protection)", () => {
  it.each(["/dashboard", "/admin", "/events/some-event", "/dashboard?tab=1"])("allows %s", (p) => {
    expect(safeNext(p)).toBe(p);
  });
  it.each([
    "https://evil.test",
    "http://evil.test/x",
    "//evil.test",
    "/\\evil.test",
    "\\\\evil.test",
    "javascript:alert(1)",
    "evil.test",
    "",
    "/ok\nSet-Cookie: x=1",
    null,
    undefined,
    42,
  ])("falls back for %s", (p) => {
    expect(safeNext(p as unknown)).toBe("/dashboard");
  });
  it("uses a custom fallback", () => {
    expect(safeNext("//x.test", "/home")).toBe("/home");
  });
});
