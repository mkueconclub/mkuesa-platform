import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leadershipRoles, memberApproverRoles, memberReaderRoles, staffRoles, userRoles } from "@/lib/auth/roles";

// The database is the real authority. These tests fail if the TypeScript role lists drift from the SQL.
const dir = join(process.cwd(), "supabase/migrations");
const sql = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(dir, f), "utf8")).join("\n");

const roleArray = (fn: string): string[] => {
  // Later migrations may redefine a function with `create or replace`, so the LAST definition is the live one.
  const m = [...sql.matchAll(new RegExp(`function private\\.${fn}\\(\\)[\\s\\S]*?array\\[([^\\]]+)\\]`, "g"))].at(-1);
  if (!m) throw new Error(`could not find ${fn} in migrations`);
  return m[1].split(",").map((s) => s.trim().replace(/'/g, ""));
};

describe("roles stay in sync with the database", () => {
  it("user_role enum matches userRoles", () => {
    const m = sql.match(/create type public\.user_role as enum \(([^)]+)\)/);
    expect(m).toBeTruthy();
    expect(m![1].split(",").map((s) => s.trim().replace(/'/g, ""))).toEqual([...userRoles]);
  });
  it("leadership roles match is_leadership()", () => expect(roleArray("is_leadership")).toEqual([...leadershipRoles]));
  it("member-reader roles match is_member_reader()", () => expect(roleArray("is_member_reader")).toEqual([...memberReaderRoles]));
  it("member-approver roles match is_member_approver()", () => expect(roleArray("is_member_approver")).toEqual([...memberApproverRoles]));
  it("staff roles are everyone except plain members", () => {
    expect(staffRoles).not.toContain("member");
    expect(staffRoles).toHaveLength(userRoles.length - 1);
  });
  it("only Super Admin, Chairperson, Treasurer and Membership Coordinator can approve members", () => {
    expect([...memberApproverRoles].sort()).toEqual(["chairperson", "membership_coordinator", "super_admin", "treasurer"]);
  });
  it("treasurer and content editor can never read individual member data", () => {
    expect(memberReaderRoles).not.toContain("treasurer");
    expect(memberReaderRoles).not.toContain("content_editor");
  });
});
