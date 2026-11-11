import { describe, expect, it } from "vitest";
import { currentAcademicYear } from "@/config/association";
import { currentMembership, eventHasEnded, hasActiveMembership, registrationOpen } from "@/lib/member/queries";
import { fieldErrors } from "@/lib/validation/auth";
import { eventIdSchema, profileSchema } from "@/lib/validation/member";
import type { MembershipRow } from "@/types/database";

const valid = { fullName: "Amina Otieno", phone: "+254 700 000 000", registrationNumber: "ECO-123", programme: "BA Economics", yearOfStudy: "3" };

describe("profileSchema", () => {
  it("accepts valid input", () => {
    const r = profileSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.yearOfStudy).toBe(3);
  });
  it("treats blank optional fields as absent", () => {
    const r = profileSchema.safeParse({ fullName: "Amina Otieno", phone: "", registrationNumber: "", programme: "", yearOfStudy: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ phone: undefined, registrationNumber: undefined, programme: undefined, yearOfStudy: undefined });
  });
  it.each([
    ["one-letter name", { fullName: "A" }, "fullName"],
    ["letters in phone", { phone: "call me" }, "phone"],
    ["too-short phone", { phone: "12345" }, "phone"],
    ["too-short registration number", { registrationNumber: "AB" }, "registrationNumber"],
    ["year 0", { yearOfStudy: "0" }, "yearOfStudy"],
    ["year 9", { yearOfStudy: "9" }, "yearOfStudy"],
    ["year not a number", { yearOfStudy: "abc" }, "yearOfStudy"],
  ])("rejects %s", (_n, override, field) => {
    const r = profileSchema.safeParse({ ...valid, ...override });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error))).toContain(field);
  });
  it("ignores fields a member must never set (role, email)", () => {
    const r = profileSchema.safeParse({ ...valid, role: "super_admin", email: "x@y.test" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).not.toHaveProperty("role");
    if (r.success) expect(r.data).not.toHaveProperty("email");
  });
});

describe("eventIdSchema", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(eventIdSchema.safeParse({ eventId: "10000000-0000-4000-8000-000000000001" }).success).toBe(true);
    expect(eventIdSchema.safeParse({ eventId: "1; drop table events" }).success).toBe(false);
    expect(eventIdSchema.safeParse({}).success).toBe(false);
  });
});

const m = (over: Partial<MembershipRow>): MembershipRow => ({
  status: "approved", academic_year: currentAcademicYear, membership_number: "MKUESA-00001", rejection_reason: null, expires_at: null, applied_at: "2026-11-01T00:00:00Z", ...over,
});

describe("membership helpers", () => {
  const today = new Date("2026-11-11T10:00:00Z");
  it("finds the membership for the current academic year", () => {
    expect(currentMembership([m({ academic_year: "2025/2026" }), m({})])?.academic_year).toBe(currentAcademicYear);
    expect(currentMembership([m({ academic_year: "2025/2026" })])).toBeNull();
  });
  it("counts approved, unexpired memberships as active", () => {
    expect(hasActiveMembership([m({})], today)).toBe(true);
    expect(hasActiveMembership([m({ expires_at: "2027-06-30" })], today)).toBe(true);
    expect(hasActiveMembership([m({ expires_at: "2026-11-11" })], today)).toBe(true);
  });
  it("does not count pending, rejected, suspended or expired memberships", () => {
    for (const status of ["pending", "rejected", "suspended", "expired"] as const) expect(hasActiveMembership([m({ status })], today)).toBe(false);
    expect(hasActiveMembership([m({ expires_at: "2026-11-10" })], today)).toBe(false);
    expect(hasActiveMembership([], today)).toBe(false);
  });
});

describe("event helpers", () => {
  const now = new Date("2026-11-11T10:00:00Z");
  const base = { registration_required: true, registration_deadline: null, starts_at: "2026-12-01T10:00:00Z", ends_at: null };
  it("opens registration for a future event that requires it", () => expect(registrationOpen(base, now)).toBe(true));
  it("closes registration when not required, past the deadline, or over", () => {
    expect(registrationOpen({ ...base, registration_required: false }, now)).toBe(false);
    expect(registrationOpen({ ...base, registration_deadline: "2026-11-10T00:00:00Z" }, now)).toBe(false);
    expect(registrationOpen({ ...base, starts_at: "2026-11-01T10:00:00Z" }, now)).toBe(false);
  });
  it("keeps an event running until its end time", () => {
    const running = { starts_at: "2026-11-11T08:00:00Z", ends_at: "2026-11-11T12:00:00Z" };
    expect(eventHasEnded(running, now)).toBe(false);
    expect(eventHasEnded({ starts_at: "2026-11-11T08:00:00Z", ends_at: null }, now)).toBe(true);
  });
});
