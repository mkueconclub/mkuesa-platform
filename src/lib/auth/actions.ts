"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentAcademicYear, privacyNoticeVersion } from "@/config/association";
import { siteConfig } from "@/config/site";
import { safeNext } from "@/lib/auth/redirect";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { echo, formData2obj, invalid, NOT_CONFIGURED, type FormState } from "@/lib/forms";
import {
  contactSchema,
  fieldErrors,
  loginSchema,
  membershipApplicationSchema,
  registerSchema,
  resetRequestSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

export type { FormState };

/** The address of this site as the visitor sees it (works on localhost, preview deployments and production). */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  return siteConfig.url;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  const v = parsed.data;
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };

  const supabase = await createClient();
  const origin = await siteOrigin();
  let result;
  try {
    result = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      // After the email link is opened the person lands on "Email verified" (see /auth/confirm).
      emailRedirectTo: `${origin}/auth/confirm?next=/auth/verified`,
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

/**
 * Start Google OAuth (Continue with Google).
 * Redirects the browser to Google, then back to /auth/confirm which exchanges the code
 * and lands the person on the dashboard (or the safe "next" path).
 * Requires the Google provider to be enabled in the Supabase project.
 */
export async function signInWithGoogleAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    // Fall back to the login page with a clear message rather than throwing.
    redirect("/login?error=config");
  }

  const next = safeNext(formData.get("next"));
  const origin = await siteOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      queryParams: {
        // Ask for a refresh token and show the account picker every time
        // so people can switch Google accounts cleanly.
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    console.error("Google OAuth start failed:", error.status, error.code ?? error.name, error.message);
    redirect("/login?error=oauth");
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=oauth");
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
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // The link signs the person in briefly, then /auth/confirm opens the "choose a new password" page.
    redirectTo: `${origin}/auth/confirm?type=recovery&next=/reset-password/update`,
  });
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
