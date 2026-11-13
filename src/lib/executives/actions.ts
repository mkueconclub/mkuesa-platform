"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { echo, formData2obj, invalid, NOT_CONFIGURED, type FormState } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/auth";
import {
  executiveApprovalSchema,
  executiveContactSchema,
  executiveMessageSchema,
  executiveMessageStatusSchema,
} from "@/lib/validation/executive";

const FORBIDDEN: FormState = { ok: false, message: "Your role does not allow this action." };
const GENERIC: FormState = { ok: false, message: "Something went wrong. Please try again." };

/** A visitor writes to one officer. Open to everyone on purpose; the database throttles it and checks the officer is available. */
export async function sendExecutiveMessageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = executiveMessageSchema.safeParse(formData2obj(formData));
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend it worked.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Thank you. Your message has been sent." };
    return invalid(fieldErrors(parsed.error), formData);
  }
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };
  const { error } = await (await createClient()).rpc("submit_executive_message", {
    p_executive: parsed.data.executiveId,
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_subject: parsed.data.subject,
    p_message: parsed.data.message,
  });
  if (error) {
    if (error.message.includes("rate_limited")) return { ok: false, message: "Too many messages right now. Please try again later.", values: echo(formData) };
    if (error.message.includes("not_available")) return { ok: false, message: "This officer cannot receive messages through the website at the moment.", values: echo(formData) };
    console.error("executive message failed:", error.code);
    return { ok: false, message: "Your message could not be sent. Please try again later.", values: echo(formData) };
  }
  return { ok: true, message: "Thank you. Your message has been sent to this officer." };
}

/** The signed-in officer adds or changes their own contact email and bio (only possible once approved). */
export async function saveExecutiveContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = executiveContactSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };
  await requireProfile("/admin/executive-profile");
  const { error } = await (await createClient()).rpc("set_my_executive_contact", { p_email: parsed.data.email, p_bio: parsed.data.bio ?? "" });
  if (error) {
    if (error.message.includes("not_approved")) return { ok: false, message: "Your committee entry has not been approved by the Super Administrator yet.", values: echo(formData) };
    if (error.message.includes("invalid_input")) return invalid({ email: "Enter a valid email address." }, formData);
    console.error("executive contact failed:", error.code);
    return { ...GENERIC, values: echo(formData) };
  }
  revalidatePath("/about");
  revalidatePath("/admin/executive-profile");
  return { ok: true, message: "Saved. Visitors can now open your profile on the About page and write to you." };
}

/** The officer triages their own messages. The database only lets them touch messages sent to them. */
export async function setExecutiveMessageStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = executiveMessageStatusSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return { ok: false, message: "Choose a valid status." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  await requireProfile("/admin/executive-inbox");
  const { data, error } = await (await createClient()).from("executive_messages").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("id");
  if (error) {
    console.error("executive message status failed:", error.code);
    return GENERIC;
  }
  if (!data?.length) return { ok: false, message: "That message could not be updated." };
  revalidatePath("/admin/executive-inbox");
  return { ok: true, message: "Updated." };
}

/** The officer deletes a message sent to them (for example spam). */
export async function deleteExecutiveMessageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = executiveMessageStatusSchema.pick({ id: true }).safeParse(formData2obj(formData));
  if (!parsed.success) return { ok: false, message: "Unknown message." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  await requireProfile("/admin/executive-inbox");
  const { data, error } = await (await createClient()).from("executive_messages").delete().eq("id", parsed.data.id).select("id");
  if (error) {
    console.error("executive message delete failed:", error.code);
    return GENERIC;
  }
  if (!data?.length) return { ok: false, message: "That message could not be deleted." };
  revalidatePath("/admin/executive-inbox");
  return { ok: true, message: "Deleted." };
}

/** Super Administrator only: approve a committee entry for an officer's account, or withdraw the approval. */
export async function approveExecutiveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = executiveApprovalSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return { ok: false, message: "Unknown committee entry." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const me = await requireProfile("/admin/committee");
  if (!can.approveExecutives(me.role)) return FORBIDDEN;

  const supabase = await createClient();
  const { id, intent } = parsed.data;
  if (intent === "withdraw") {
    const { data, error } = await supabase.from("executive_positions").update({ public_consent: false }).eq("id", id).select("id");
    if (error || !data?.length) {
      console.error("executive withdraw failed:", error?.code);
      return GENERIC;
    }
  } else {
    const profileId = parsed.data.profileId ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) return { ok: false, message: "Choose the officer's account first." };
    const { data: account } = await supabase.from("profiles").select("id, role").eq("id", profileId).maybeSingle();
    if (!account || account.role === "member") return { ok: false, message: "That account has no officer role yet. Give it one under Members first." };
    const { data, error } = await supabase.from("executive_positions").update({ profile_id: profileId, public_consent: true }).eq("id", id).select("id");
    if (error || !data?.length) {
      console.error("executive approve failed:", error?.code);
      return GENERIC;
    }
  }
  revalidatePath("/about");
  revalidatePath("/admin/committee");
  revalidatePath(`/admin/committee/${id}`);
  return { ok: true, message: intent === "approve" ? "Approved. The officer can now add their contact email, and appears on the About page." : "Approval withdrawn. The officer no longer appears on the About page." };
}
