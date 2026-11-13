"use server";

import { revalidatePath } from "next/cache";
import { leadershipRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Kind = "alumnus" | "opportunity";

/** Approve or reject. Leadership only here; the database policies and triggers enforce it again. */
export async function reviewAlumniAction(formData: FormData) {
  const profile = await requireRole(leadershipRoles, "/admin/alumni");
  const kind = formData.get("kind") as Kind;
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision") === "approved" ? "approved" : "rejected";
  if (!id || (kind !== "alumnus" && kind !== "opportunity")) return;
  const supabase = await createClient();
  const { error } =
    kind === "alumnus"
      ? await supabase.from("alumni_profiles").update({ status: decision, reviewed_by: profile.id }).eq("id", id)
      : await supabase.from("opportunities").update({ submission_status: decision }).eq("id", id).not("submission_status", "is", null);
  if (error) console.error("alumni review failed:", error.code, error.message);
  revalidatePath("/admin/alumni");
  revalidatePath("/opportunities");
}
