"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAcademicYear, privacyNoticeVersion } from "@/config/association";
import { safeNext } from "@/lib/auth/redirect";
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

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> };

const formData2obj = (fd: FormData) => Object.fromEntries(fd.entries());
const invalid = (errors: Record<string, string>): FormState => ({ ok: false, message: "Please correct the highlighted fields.", errors });

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error));
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
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
  if (error) {
    console.error("register failed:", error.code ?? error.name);
    return { ok: false, message: "We could not create the account. Check your details and try again in a few minutes." };
  }
  if (data.session) redirect("/dashboard"); // only when email confirmation is switched off
  // Same message whether or not the address already has an account (prevents account enumeration).
  return { ok: true, message: "Almost done. If this address can be registered, a confirmation link is on its way. Open it to activate your account." };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: "Incorrect email or password, or the email has not been confirmed yet." };
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error) console.error("reset request failed:", error.code ?? error.name);
  return { ok: true, message: "If an account exists for that address, a reset link has been sent." };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = updatePasswordSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error));
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "This reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: "Could not update the password. Choose a different one and try again." };
  redirect("/dashboard");
}

export async function applyForMembershipAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = membershipApplicationSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error));
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
    return invalid(fieldErrors(parsed.error));
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
