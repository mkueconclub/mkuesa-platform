import { describe, expect, it } from "vitest";
import { adminNavFor, can } from "@/lib/auth/permissions";
import { userRoles } from "@/lib/auth/roles";
import { canBeContacted, initials } from "@/lib/executives/profile";
import { fieldErrors } from "@/lib/validation/auth";
import { executiveApprovalSchema, executiveContactSchema, executiveMessageSchema, executiveMessageStatusSchema } from "@/lib/validation/executive";
import { read, sqlFiles } from "./support-fs";

const ID = "00000000-0000-4000-8000-000000000001";
const msg = { executiveId: ID, name: "Amina Otieno", email: "Amina@Example.test", subject: "Hello", message: "A message that is long enough." };

describe("message to an executive", () => {
  it("accepts a valid message and lower-cases the sender's email", () => {
    const r = executiveMessageSchema.safeParse(msg);
    expect(r.success && r.data.email).toBe("amina@example.test");
  });
  it.each([
    ["executiveId", "not-a-uuid"],
    ["name", "A"],
    ["email", "nope"],
    ["subject", "Hi"],
    ["message", "short"],
    ["message", "x".repeat(2001)],
  ])("rejects a bad %s", (field, value) => {
    const r = executiveMessageSchema.safeParse({ ...msg, [field]: value });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error))).toContain(field);
  });
  it("flags a filled honeypot", () => {
    const r = executiveMessageSchema.safeParse({ ...msg, website: "http://spam.test" });
    expect(!r.success && r.error.issues.some((i) => i.path[0] === "website")).toBe(true);
  });
});

describe("officer contact details", () => {
  it("requires a valid email and keeps the bio optional", () => {
    expect(executiveContactSchema.safeParse({ email: "" }).success).toBe(false);
    expect(executiveContactSchema.safeParse({ email: "not an email" }).success).toBe(false);
    const ok = executiveContactSchema.safeParse({ email: "Chair@Example.test", bio: "  " });
    expect(ok.success && ok.data).toEqual({ email: "chair@example.test", bio: undefined });
    expect(executiveContactSchema.safeParse({ email: "a@b.co", bio: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("inbox and approval inputs", () => {
  it("only accepts the four known message statuses", () => {
    expect(executiveMessageStatusSchema.safeParse({ id: ID, status: "replied" }).success).toBe(true);
    expect(executiveMessageStatusSchema.safeParse({ id: ID, status: "deleted" }).success).toBe(false);
  });
  it("only accepts approve or withdraw", () => {
    expect(executiveApprovalSchema.safeParse({ id: ID, intent: "approve", profileId: ID }).success).toBe(true);
    expect(executiveApprovalSchema.safeParse({ id: ID, intent: "promote" }).success).toBe(false);
  });
});

describe("who may do what", () => {
  it("only the Super Administrator approves officers", () => expect(userRoles.filter(can.approveExecutives)).toEqual(["super_admin"]));
  it("every officer role has the profile and inbox, the content editor and members do not", () => {
    expect(userRoles.filter(can.useExecutiveProfile).sort()).toEqual(["chairperson", "membership_coordinator", "secretary", "super_admin", "treasurer", "vice_chairperson"]);
    expect(adminNavFor("treasurer").map((i) => i.href)).toEqual(expect.arrayContaining(["/admin/executive-profile", "/admin/executive-inbox"]));
    expect(adminNavFor("content_editor").map((i) => i.href)).not.toContain("/admin/executive-inbox");
  });
});

describe("profile helpers", () => {
  it("builds initials", () => {
    expect(initials("Joy Masinde")).toBe("JM");
    expect(initials("Brian Kamau Angwenyi")).toBe("BA");
    expect(initials("Seth")).toBe("S");
  });
  it("an officer can be contacted only after adding an email", () => {
    expect(canBeContacted({ contact_email: null })).toBe(false);
    expect(canBeContacted({ contact_email: "a@b.co" })).toBe(true);
  });
});

describe("database rules in the migration", () => {
  const sql = sqlFiles().map((f) => ({ f, text: read(f) })).find((x) => x.f.includes("executive_profiles"))!.text;
  it("only the owner reads messages, and only through the guarded function can visitors write", () => {
    expect(sql).toMatch(/create policy exec_msg_select[\s\S]*?private\.owns_executive\(executive_id\)/);
    expect(sql).not.toMatch(/grant [^;]*on public\.executive_messages to anon/);
    expect(sql).toContain("grant execute on function public.submit_executive_message");
    expect(sql).toMatch(/rate_limited/);
    expect(sql).toMatch(/interval '1 hour'/);
  });
  it("approval is limited to the Super Administrator and the email to its owner", () => {
    expect(sql).toContain("super_admin_only");
    expect(sql).toContain("not_your_entry");
  });
});
