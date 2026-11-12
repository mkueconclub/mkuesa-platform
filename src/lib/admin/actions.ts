"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { certificateTypes, getContentConfig } from "@/lib/admin/content-config";
import { parseContent, slugify } from "@/lib/admin/content-payload";
import { can, contentPermissions } from "@/lib/auth/permissions";
import { isUserRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { echo, formData2obj, invalid, NOT_CONFIGURED, type FormState } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/auth";
import { z } from "zod";

const FORBIDDEN: FormState = { ok: false, message: "Your role does not allow this action." };
const uuid = z.uuid();

function dbError(error: { code?: string; message?: string }, what: string): FormState {
  if (error.code === "42501") return { ok: false, message: "The database refused this change. Your role may not allow it (for example, editors can only work on drafts)." };
  if (error.code === "23514") return { ok: false, message: "One of the values is not allowed. Check lengths and web addresses." };
  console.error(`${what} failed:`, error.code, error.message);
  return { ok: false, message: "Something went wrong. Please try again." };
}

// ---------------------------------------------------------------- content (events, announcements, resources, ...)

export async function saveContentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const cfg = getContentConfig(fd.get("kind"));
  if (!cfg) return { ok: false, message: "Unknown content type." };
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(fd) };

  const profile = await requireProfile(cfg.basePath);
  const perms = contentPermissions(cfg.kind, profile.role);
  if (!perms.write) return FORBIDDEN;

  const parsed = parseContent(cfg, fd, { allowedStatuses: perms.draftOnly ? ["draft"] : undefined });
  if (!parsed.ok) return invalid(parsed.errors, fd);

  const supabase = await createClient();
  const idRaw = fd.get("id");
  const id = typeof idRaw === "string" && idRaw ? idRaw : null;

  if (id) {
    if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown item." };
    const { data, error } = await supabase.from(cfg.table).update(parsed.data).eq("id", id).select("id");
    if (error) return { ...dbError(error, `update ${cfg.table}`), values: echo(fd) };
    if (!data?.length) return { ok: false, message: "Nothing was saved. The item may not exist, or your role may not allow editing it.", values: echo(fd) };
  } else {
    const title = String(parsed.data[cfg.titleField] ?? "");
    let slug = slugify(title);
    for (let attempt = 0; ; attempt++) {
      const row = cfg.hasSlug ? { ...parsed.data, slug } : parsed.data;
      const { error } = await supabase.from(cfg.table).insert(row);
      if (!error) break;
      if (cfg.hasSlug && error.code === "23505" && attempt < 3) {
        slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
        continue;
      }
      return { ...dbError(error, `insert ${cfg.table}`), values: echo(fd) };
    }
  }
  revalidatePath(cfg.basePath);
  redirect(`${cfg.basePath}?saved=1`);
}

export async function deleteContentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const cfg = getContentConfig(fd.get("kind"));
  const id = fd.get("id");
  if (!cfg || typeof id !== "string" || !uuid.safeParse(id).success) return { ok: false, message: "Unknown item." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = await requireProfile(cfg.basePath);
  if (!contentPermissions(cfg.kind, profile.role).delete) return FORBIDDEN;

  const supabase = await createClient();
  const { data, error } = await supabase.from(cfg.table).delete().eq("id", id).select("id");
  if (error) return dbError(error, `delete ${cfg.table}`);
  if (!data?.length) return { ok: false, message: "Nothing was deleted." };
  revalidatePath(cfg.basePath);
  redirect(`${cfg.basePath}?deleted=1`);
}

// ---------------------------------------------------------------- membership applications

const reviewSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(["pending", "approved", "rejected", "suspended", "expired"]),
    reason: z.string().trim().max(300, "Use 300 characters or fewer.").optional().transform((v) => v || undefined),
    expiresAt: z
      .string()
      .optional()
      .transform((v) => v || undefined)
      .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date."),
  })
  .refine((v) => v.status !== "rejected" || v.reason, { path: ["reason"], message: "Give a short reason; the applicant will see it." });

export async function reviewMembershipAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = reviewSchema.safeParse(formData2obj(fd));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), fd);
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = await requireProfile("/admin/members/applications");
  if (!can.reviewApplications(profile.role)) return FORBIDDEN;

  const v = parsed.data;
  const update: Record<string, unknown> = { status: v.status, rejection_reason: v.status === "rejected" ? v.reason : null };
  if (v.status === "approved") update.expires_at = v.expiresAt ?? null;

  const supabase = await createClient();
  // The database stamps the reviewer and time, and issues the membership number on first approval.
  const { data, error } = await supabase.from("memberships").update(update).eq("id", v.id).select("id");
  if (error) return dbError(error, "review membership");
  if (!data?.length) return { ok: false, message: "That application could not be updated." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Marked as ${v.status}.` };
}

// ---------------------------------------------------------------- roles

export async function changeRoleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const target = fd.get("target");
  const role = fd.get("role");
  if (typeof target !== "string" || !uuid.safeParse(target).success || !isUserRole(role)) return { ok: false, message: "Choose a valid role." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = await requireProfile("/admin/members");
  if (!can.changeRoles(profile.role)) return FORBIDDEN;

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { target, new_role: role });
  if (error) {
    if (error.message.includes("cannot_change_own_role")) return { ok: false, message: "You cannot change your own role. Ask another Super Administrator." };
    if (error.message.includes("forbidden")) return FORBIDDEN;
    return dbError(error, "set_user_role");
  }
  revalidatePath("/admin/members");
  return { ok: true, message: "Role updated." };
}

// ---------------------------------------------------------------- certificates

const issueSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter the holder's email address.")),
  title: z.string().trim().min(3, "Enter a title of at least 3 characters.").max(200, "Use 200 characters or fewer."),
  certificateType: z.enum(certificateTypes, "Choose a type."),
  eventId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
});

export async function issueCertificateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = issueSchema.safeParse(formData2obj(fd));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), fd);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(fd) };
  const profile = await requireProfile("/admin/certificates");
  if (!can.issueCertificates(profile.role)) return FORBIDDEN;

  const v = parsed.data;
  const supabase = await createClient();
  const { data: holder } = await supabase.from("profiles").select("id").eq("email", v.email).maybeSingle();
  if (!holder) return { ok: false, message: "Please correct the highlighted fields.", errors: { email: "No account uses this email address." }, values: echo(fd) };

  const { error } = await supabase.from("certificates").insert({
    profile_id: holder.id,
    event_id: v.eventId ?? null,
    title: v.title,
    certificate_type: v.certificateType,
  });
  if (error) return { ...dbError(error, "issue certificate"), values: echo(fd) };
  revalidatePath("/admin/certificates");
  return { ok: true, message: "Certificate issued." };
}

const revokeSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3, "Give a short reason.").max(300, "Use 300 characters or fewer."),
});

export async function revokeCertificateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = revokeSchema.safeParse(formData2obj(fd));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), fd);
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = await requireProfile("/admin/certificates");
  if (!can.revokeCertificates(profile.role)) return FORBIDDEN;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .update({ revoked_at: new Date().toISOString(), revoked_reason: parsed.data.reason })
    .eq("id", parsed.data.id)
    .is("revoked_at", null)
    .select("id");
  if (error) return dbError(error, "revoke certificate");
  if (!data?.length) return { ok: false, message: "That certificate could not be revoked." };
  revalidatePath("/admin/certificates");
  return { ok: true, message: "Certificate revoked." };
}

// ---------------------------------------------------------------- event attendance

export async function markAttendedAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = fd.get("id");
  if (typeof id !== "string" || !uuid.safeParse(id).success) return { ok: false, message: "Unknown registration." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = await requireProfile("/admin/events");
  if (!can.seeRegistrations(profile.role)) return FORBIDDEN;

  const supabase = await createClient();
  // The database stamps the attendance time.
  const { data, error } = await supabase.from("event_registrations").update({ status: "attended" }).eq("id", id).eq("status", "registered").select("id");
  if (error) return dbError(error, "mark attended");
  if (!data?.length) return { ok: false, message: "Only confirmed registrations can be marked as attended." };
  revalidatePath("/admin/events", "layout");
  return { ok: true, message: "Marked as attended." };
}

// ---------------------------------------------------------------- contact messages

export async function setMessageStatusAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.uuid(), status: z.enum(["new", "read", "replied", "spam"]) }).safeParse(formData2obj(fd));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = await requireProfile("/admin/messages");
  if (!can.updateMessages(profile.role)) return FORBIDDEN;

  const supabase = await createClient();
  const { data, error } = await supabase.from("contact_messages").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("id");
  if (error) return dbError(error, "update message");
  if (!data?.length) return { ok: false, message: "Message not found." };
  revalidatePath("/admin/messages");
  return { ok: true, message: "Updated." };
}
