"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAcademicYear, privacyNoticeVersion } from "@/config/association";
import { safeNext } from "@/lib/auth/redirect";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  contactSchema,
  fieldErrors,
  loginSchema,
  membershipApplicationSchema,
  registerSchema,
  resetRequestSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

export type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Echo of what the person typed (never passwords), so React 19's automatic form reset does not wipe the fields. */
  values?: Record<string, string>;
};

const formData2obj = (fd: FormData) => Object.fromEntries(fd.entries());
const SECRET_FIELDS = new Set(["password", "confirm", "next"]);
function echo(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !SECRET_FIELDS.has(k)) out[k] = v;
  return out;
}
const invalid = (errors: Record<string, string>, fd?: FormData): FormState => ({
  ok: false,
  message: "Please correct the highlighted fields.",
  errors,
  values: fd ? echo(fd) : undefined,
});
const NOT_CONFIGURED: FormState = {
  ok: false,
  message: "The service is not configured yet (Supabase keys are missing). Fill in .env.local and restart the dev server.",
};

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  const v = parsed.data;
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };

  const supabase = await createClient();
  let result;
  try {
    result = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      data: {
        full_name: v.fullName,
        programme: v.programme ?? "",
        year_of_study: v.yearOfStudy ? String(v.yearOfStudy) : "",
        consent: true,
        privacy_notice_version: privacyNoticeVersion,
      },
    },
    });
  } catch (e) {
    console.error("register threw:", e);
    return { ok: false, message: "Could not reach the sign-up service. Check your connection and try again.", values: echo(formData) };
  }
  const { data, error } = result;
  if (error) {
    // Log the real reason (e.g. "unexpected_failure" = a database trigger failed) so it can be diagnosed.
    console.error("register failed:", error.status, error.code ?? error.name, error.message);
    const message =
      error.code === "weak_password"
        ? "That password is too weak. Use at least 10 characters with a mix of letters and numbers."
        : error.code === "over_email_send_rate_limit" || error.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : "We could not create the account. Check your details and try again in a few minutes.";
    return { ok: false, message, values: echo(formData) };
  }
  if (data.session) redirect("/dashboard"); // only when email confirmation is switched off
  // Same message whether or not the address already has an account (prevents account enumeration).
  return { ok: true, message: "Almost done. If this address can be registered, a confirmation link is on its way. Open it to activate your account." };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };

  const supabase = await createClient();
  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword(parsed.data));
  } catch (e) {
    console.error("login threw:", e);
    return { ok: false, message: "Could not reach the sign-in service. Check your connection and try again.", values: echo(formData) };
  }
  if (error) {
    console.error("login failed:", error.status, error.code ?? error.name);
    const message =
      error.code === "email_not_confirmed"
        ? "Please confirm your email first: open the link we sent you, then sign in."
        : "Incorrect email or password.";
    return { ok: false, message, values: echo(formData) };
  }
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error) console.error("reset request failed:", error.code ?? error.name);
  return { ok: true, message: "If an account exists for that address, a reset link has been sent." };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = updatePasswordSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "This reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: "Could not update the password. Choose a different one and try again." };
  redirect("/dashboard");
}

export async function applyForMembershipAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = membershipApplicationSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/dashboard");

  // Row Level Security guarantees this can only ever be the user's own application.
  const { error } = await supabase.from("memberships").insert({
    profile_id: auth.user.id,
    academic_year: currentAcademicYear,
    motivation: parsed.data.motivation ?? null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "You have already applied for this academic year." };
    console.error("membership application failed:", error.code);
    return { ok: false, message: "Your application could not be submitted. Please try again." };
  }
  revalidatePath("/dashboard");
  return { ok: true, message: "Application submitted. The membership team will review it." };
}

export async function submitContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(formData2obj(formData));
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend it worked.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Thank you. Your message has been sent." };
    return invalid(fieldErrors(parsed.error), formData);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_subject: parsed.data.subject,
    p_message: parsed.data.message,
  });
  if (error) {
    if (error.message.includes("rate_limited")) return { ok: false, message: "Too many messages right now. Please try again later." };
    console.error("contact failed:", error.code);
    return { ok: false, message: "Your message could not be sent. Please try again later." };
  }
  return { ok: true, message: "Thank you. Your message has been sent." };
}
