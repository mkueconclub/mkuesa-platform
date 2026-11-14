import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { membershipFees } from "@/config/association";
import { hasActiveMembership } from "@/lib/member/queries";
import type { MembershipRow } from "@/types/database";

const row = (over: Partial<MembershipRow>): MembershipRow =>
  ({ status: "pending", academic_year: "2026/2027", membership_number: null, rejection_reason: null, expires_at: null, applied_at: "2026-11-01T00:00:00Z", ...over }) as MembershipRow;

describe("member dashboard gate", () => {
  it("stays closed until a membership is approved and not expired", () => {
    expect(hasActiveMembership([], new Date(), "member")).toBe(false);
    expect(hasActiveMembership([row({ status: "pending" })], new Date(), "member")).toBe(false);
    expect(hasActiveMembership([row({ status: "rejected" })], new Date(), "member")).toBe(false);
    expect(hasActiveMembership([row({ status: "approved", expires_at: "2020-01-01" })], new Date(), "member")).toBe(false);
    expect(hasActiveMembership([row({ status: "approved" })], new Date(), "member")).toBe(true);
    expect(hasActiveMembership([], new Date(), "super_admin")).toBe(true);
  });
  it("shows the fees and the Pochi la Biashara number", () => {
    expect(membershipFees).toMatchObject({ newMember: 100, renewal: 50, renewalPeriod: "semester", pochiLaBiashara: "0790258319" });
    const gate = readFileSync("src/components/dashboard/membership-gate.tsx", "utf8");
    expect(gate).toContain("Pochi la Biashara");
    expect(gate).toContain("membershipFees.pochiLaBiashara");
  });
  it("the layout swaps the real pages for the gate, so no member data is sent while locked", () => {
    const layout = readFileSync("src/app/dashboard/layout.tsx", "utf8");
    expect(layout).toMatch(/hasAccess \? children : <MembershipGate/);
  });
  it("the treasurer can approve in the database", () => {
    expect(readFileSync("supabase/migrations/20261118090000_treasurer_confirms_membership.sql", "utf8")).toContain("'treasurer'");
  });
});
