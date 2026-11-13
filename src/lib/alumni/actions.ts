"use server";

import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/admin/content-payload";
import { getCurrentUser } from "@/lib/auth/session";
import { echo, formData2obj, invalid, NOT_CONFIGURED, type FormState } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { alumniOpportunitySchema, alumniProfileSchema } from "@/lib/validation/alumni";
import { fieldErrors } from "@/lib/validation/auth";

const SIGNED_OUT: FormState = { ok: false, message: "Your session has ended. Please sign in again." };

export async function saveAlumniProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = alumniProfileSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const v = parsed.data;
  // The database keeps the review status: a new profile is pending, and staff alone can approve it.
  const { error } = await (await createClient()).from("alumni_profiles").upsert({
    id: user.id, graduation_year: v.graduationYear, organisation: v.organisation ?? null, position_title: v.positionTitle ?? null,
    bio: v.bio ?? null, linkedin_url: v.linkedinUrl ?? null, open_to_mentoring: v.openToMentoring,
  });
  if (error) {
    console.error("alumni profile save failed:", error.code, error.message);
    return { ok: false, message: "Your profile could not be saved. Please try again.", values: echo(formData) };
  }
  revalidatePath("/alumni");
  return { ok: true, message: "Saved. The committee verifies alumni profiles before the portal opens fully." };
}

export async function submitAlumniOpportunityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = alumniOpportunitySchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const v = parsed.data;
  const supabase = await createClient();
  for (let attempt = 0; ; attempt++) {
    // The database insists on: an approved alumnus, your own id, status draft, pending review, public visibility.
    const { error } = await supabase.from("opportunities").insert({
      title: v.title, slug: `${slugify(v.title)}-${Math.random().toString(36).slice(2, 7)}`, category: v.category,
      organisation: v.organisation, description: v.description, eligibility: v.eligibility ?? null, contact: v.contact,
      apply_url: v.applyUrl ?? null, deadline: v.deadline ? new Date(v.deadline).toISOString() : null,
      status: "draft", visibility: "public", submission_status: "pending", created_by: user.id,
    });
    if (!error) break;
    if (error.code === "23505" && attempt < 2) continue;
    if (error.code === "42501") return { ok: false, message: "Only verified alumni can submit opportunities.", values: echo(formData) };
    console.error("alumni opportunity failed:", error.code, error.message);
    return { ok: false, message: "Your submission could not be saved. Please try again.", values: echo(formData) };
  }
  revalidatePath("/alumni/opportunities");
  return { ok: true, message: "Submitted. It is now in the administrators' review queue and will appear on the Opportunities page once approved." };
}
