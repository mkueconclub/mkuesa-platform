import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { currentAcademicYear } from "@/config/association";
import { safeNext } from "@/lib/auth/redirect";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: readonly EmailOtpType[] = ["email", "signup", "recovery", "email_change", "magiclink", "invite"];

/**
 * Landing point for every link in a Supabase email. It accepts both link styles:
 *  - `?token_hash=...&type=...`  (custom email templates; works on any device or browser)
 *  - `?code=...`                 (Supabase's default templates, via the redirect URL we pass when sending;
 *                                 the code is exchanged using the cookie set in the browser that asked for the email)
 * Where the person ends up depends on what the link was for:
 *  - sign-up confirmation → /auth/verified ("Email verified")
 *  - password reset       → /reset-password/update (choose a new password)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next");

  // Supabase reports expired or already-used links as ?error=...&error_code=otp_expired
  if (searchParams.get("error") || searchParams.get("error_code")) return failure(origin, type, requestedNext);
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL("/login", origin));

  const supabase = await createClient();

  if (tokenHash && type && allowedTypes.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type === "signup" || type === "email" || type === "invite") await openMembershipApplication(supabase);
      return NextResponse.redirect(new URL(destination(type, requestedNext), origin));
    }
    console.error("confirm (token_hash) failed:", error.code ?? error.name);
    return failure(origin, type, requestedNext);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = destination(type, requestedNext);
      // Covers sign-up links and "Continue with Google"; never a password reset. Repeating it is harmless.
      if (type !== "recovery" && !target.startsWith("/reset-password")) await openMembershipApplication(supabase);
      return NextResponse.redirect(new URL(target, origin));
    }
    console.error("confirm (code) failed:", error.code ?? error.name);
    return failure(origin, type, requestedNext);
  }

  return failure(origin, type, requestedNext);
}

/**
 * A newly confirmed account is placed in the "waiting for confirmation" queue straight away, so the chairperson
 * and treasurer see it under Applications without the student having to do anything else.
 * Safe to repeat: an application for the year can only exist once.
 */
async function openMembershipApplication(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { error } = await supabase.from("memberships").insert({ profile_id: data.user.id, academic_year: currentAcademicYear });
  if (error && error.code !== "23505") console.error("open membership application failed:", error.code);
}

/** Password-reset links always finish on the "choose a new password" page; everything else on "Email verified". */
function destination(type: EmailOtpType | null, requestedNext: string | null): string {
  const fallback = type === "recovery" ? "/reset-password/update" : "/auth/verified";
  return safeNext(requestedNext, fallback);
}

function failure(origin: string, type: EmailOtpType | null, requestedNext: string | null) {
  const isReset = type === "recovery" || (requestedNext ?? "").startsWith("/reset-password");
  return NextResponse.redirect(new URL(isReset ? "/reset-password?error=expired" : "/login?error=confirm", origin));
}
