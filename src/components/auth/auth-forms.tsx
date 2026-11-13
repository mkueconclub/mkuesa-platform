"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/textarea";
import {
  applyForMembershipAction,
  loginAction,
  registerAction,
  requestPasswordResetAction,
  signInWithGoogleAction,
  submitContactAction,
  updatePasswordAction,
  type FormState,
} from "@/lib/auth/actions";

const initial: FormState = { ok: false, message: "" };

export function Status({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div role={state.ok ? "status" : "alert"} aria-live="polite">
      <Notice tone={state.ok ? "pending" : "sample"}>{state.message}</Notice>
    </div>
  );
}

export function Form({ action, children }: { action: (fd: FormData) => void; children: ReactNode }) {
  return (
    <form action={action} className="max-w-3xl space-y-5" noValidate>
      {children}
    </form>
  );
}

/** Official multicolour Google "G" — keep exact brand colours. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** Divider between OAuth and email/password. */
function AuthDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-brand-100" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-paper px-3 text-xs font-medium text-muted">or continue with email</span>
      </div>
    </div>
  );
}

/**
 * Google sign-in button styled like major product auth screens
 * (single line, fixed height, clear icon + label, strong hover).
 */
export function GoogleSignInButton({
  next = "/dashboard",
  label = "Continue with Google",
}: {
  next?: string;
  label?: string;
}) {
  return (
    <form action={signInWithGoogleAction} className="w-full">
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="group relative flex h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-lg border border-brand-200 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition duration-200 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          <GoogleIcon />
        </span>
        <span className="whitespace-nowrap tracking-tight">{label}</span>
      </button>
    </form>
  );
}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <div className="space-y-5">
      <GoogleSignInButton next={next} label="Continue with Google" />
      <AuthDivider />
      <Form action={action}>
        {notice && <Notice>{notice}</Notice>}
        <input type="hidden" name="next" value={next} />
        <Input label="Email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required error={state.errors?.email} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" required error={state.errors?.password} />
        {!state.ok && <Status state={state} />}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-muted">
          <Link href="/reset-password" className="font-medium text-brand-700 hover:underline">
            Forgot your password?
          </Link>
          {" · "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Form>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);
  if (state.ok) return <Status state={state} />;
  return (
    <div className="space-y-5">
      <GoogleSignInButton next="/dashboard" label="Continue with Google" />
      <AuthDivider />
      <Form action={action}>
        <Input label="Full name" name="fullName" defaultValue={state.values?.fullName} autoComplete="name" required error={state.errors?.fullName} />
        <Input
          label="Email"
          name="email"
          defaultValue={state.values?.email}
          type="email"
          autoComplete="email"
          required
          hint="Any email address you can access."
          error={state.errors?.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          hint="At least 10 characters."
          error={state.errors?.password}
        />
        {/* Side-by-side on tablet/desktop so the form is shorter and more balanced */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Programme (optional)" name="programme" defaultValue={state.values?.programme} error={state.errors?.programme} />
          <Input
            label="Year of study (optional)"
            name="yearOfStudy"
            defaultValue={state.values?.yearOfStudy}
            type="number"
            min={1}
            max={8}
            inputMode="numeric"
            error={state.errors?.yearOfStudy}
          />
        </div>
        <div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="consent"
              required
              defaultChecked={state.values?.consent === "on"}
              className="mt-1 size-4 accent-brand-700"
            />
            <span>
              I have read the{" "}
              <Link href="/privacy" className="font-medium text-brand-700 underline">
                privacy notice
              </Link>{" "}
              and agree to MKUESA processing my details as described.
            </span>
          </label>
          {state.errors?.consent && (
            <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
              {state.errors.consent}
            </p>
          )}
        </div>
        <Status state={state} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Form>
    </div>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);
  if (state.ok) return <Status state={state} />;
  return (
    <Form action={action}>
      <Input label="Email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required error={state.errors?.email} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending…" : "Send reset link"}</Button>
    </Form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initial);
  return (
    <Form action={action}>
      <Input label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} hint="At least 10 characters." error={state.errors?.password} />
      <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={state.errors?.confirm} />
      {!state.errors && <Status state={state} />}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Set new password"}</Button>
    </Form>
  );
}

export function ApplyMembershipForm({ academicYear }: { academicYear: string }) {
  const [state, action, pending] = useActionState(applyForMembershipAction, initial);
  return (
    <Form action={action}>
      <Textarea label="Why would you like to join? (optional)" name="motivation" defaultValue={state.values?.motivation} maxLength={500} className="min-h-24" error={state.errors?.motivation} />
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Submitting…" : `Apply for ${academicYear}`}</Button>
    </Form>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactAction, initial);
  if (state.ok) return <Status state={state} />;
  return (
    <Form action={action}>
      <Input label="Full name" name="name" defaultValue={state.values?.name} autoComplete="name" required error={state.errors?.name} />
      <Input label="Email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required error={state.errors?.email} />
      <Input label="Subject" name="subject" defaultValue={state.values?.subject} required error={state.errors?.subject} />
      <Textarea label="Message" name="message" defaultValue={state.values?.message} required maxLength={2000} error={state.errors?.message} />
      {/* Honeypot: hidden from people and assistive technology; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
    </Form>
  );
}
