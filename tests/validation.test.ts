import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors, loginSchema, membershipApplicationSchema, registerSchema, updatePasswordSchema } from "@/lib/validation/auth";

const validRegister = { fullName: "Amina Otieno", email: "  Amina@Example.COM ", password: "correct-horse-battery", programme: "BA Economics", yearOfStudy: "2", consent: "on" };

describe("registerSchema", () => {
  it("accepts valid input and normalises the email", () => {
    const r = registerSchema.safeParse(validRegister);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("amina@example.com");
      expect(r.data.yearOfStudy).toBe(2);
    }
  });
  it("accepts any email provider (registration is not limited to university addresses)", () => {
    for (const e of ["a@gmail.com", "a@students.mku.ac.ke", "a@yahoo.co.uk", "a@proton.me"]) {
      expect(registerSchema.safeParse({ ...validRegister, email: e }).success).toBe(true);
    }
  });
  it("treats optional fields as optional", () => {
    const r = registerSchema.safeParse({ ...validRegister, programme: "", yearOfStudy: "" });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.programme).toBeUndefined(); expect(r.data.yearOfStudy).toBeUndefined(); }
  });
  it.each([
    ["short password", { password: "short" }, "password"],
    ["password over 72 characters", { password: "x".repeat(73) }, "password"],
    ["bad email", { email: "not-an-email" }, "email"],
    ["one-letter name", { fullName: "A" }, "fullName"],
    ["year 9", { yearOfStudy: "9" }, "yearOfStudy"],
    ["year 0", { yearOfStudy: "0" }, "yearOfStudy"],
    ["missing consent", { consent: undefined }, "consent"],
    ["consent not ticked", { consent: "off" }, "consent"],
  ])("rejects %s", (_name, override, field) => {
    const r = registerSchema.safeParse({ ...validRegister, ...override });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error))).toContain(field);
  });
});

describe("other schemas", () => {
  it("login requires an email and a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
  it("password update requires matching passwords", () => {
    expect(updatePasswordSchema.safeParse({ password: "long-enough-1", confirm: "long-enough-1" }).success).toBe(true);
    const r = updatePasswordSchema.safeParse({ password: "long-enough-1", confirm: "different-one" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).confirm).toMatch(/match/);
  });
  it("membership motivation is optional and capped at 500 characters", () => {
    expect(membershipApplicationSchema.safeParse({}).success).toBe(true);
    expect(membershipApplicationSchema.safeParse({ motivation: "x".repeat(500) }).success).toBe(true);
    expect(membershipApplicationSchema.safeParse({ motivation: "x".repeat(501) }).success).toBe(false);
  });
  it("contact form enforces lengths and flags the honeypot", () => {
    const ok = { name: "Visitor", email: "v@example.com", subject: "Hello", message: "A message of enough length.", website: "" };
    expect(contactSchema.safeParse(ok).success).toBe(true);
    expect(contactSchema.safeParse({ ...ok, message: "short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: "x".repeat(2001) }).success).toBe(false);
    const bot = contactSchema.safeParse({ ...ok, website: "http://spam.test" });
    expect(bot.success).toBe(false);
    if (!bot.success) expect(bot.error.issues.some((i) => i.path[0] === "website")).toBe(true);
  });
});
