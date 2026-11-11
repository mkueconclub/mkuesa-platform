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
  submitContactAction,
  updatePasswordAction,
  type FormState,
} from "@/lib/auth/actions";

const initial: FormState = { ok: false, message: "" };

function Status({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div role={state.ok ? "status" : "alert"} aria-live="polite">
      <Notice tone={state.ok ? "pending" : "sample"}>{state.message}</Notice>
    </div>
  );
}

function Form({ action, children }: { action: (fd: FormData) => void; children: ReactNode }) {
  return (
    <form action={action} className="space-y-5" noValidate>
      {children}
    </form>
  );
}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <Form action={action}>
      {notice && <Notice>{notice}</Notice>}
      <input type="hidden" name="next" value={next} />
      <Input label="Email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required error={state.errors?.email} />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required error={state.errors?.password} />
      {!state.ok && <Status state={state} />}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-sm text-muted">
        <Link href="/reset-password" className="font-medium text-brand-700 hover:underline">Forgot your password?</Link>
        {" · "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link>
      </p>
    </Form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);
  if (state.ok) return <Status state={state} />;
  return (
    <Form action={action}>
      <Input label="Full name" name="fullName" defaultValue={state.values?.fullName} autoComplete="name" required error={state.errors?.fullName} />
      <Input label="Email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required hint="Any email address you can access." error={state.errors?.email} />
      <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={10} hint="At least 10 characters." error={state.errors?.password} />
      <Input label="Programme (optional)" name="programme" defaultValue={state.values?.programme} error={state.errors?.programme} />
      <Input label="Year of study (optional)" name="yearOfStudy" defaultValue={state.values?.yearOfStudy} type="number" min={1} max={8} inputMode="numeric" error={state.errors?.yearOfStudy} />
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" required defaultChecked={state.values?.consent === "on"} className="mt-1 size-4 accent-brand-700" />
          <span>I have read the <Link href="/privacy" className="font-medium text-brand-700 underline">privacy notice</Link> and agree to MKUESA processing my details as described.</span>
        </label>
        {state.errors?.consent && <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">{state.errors.consent}</p>}
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating account…" : "Create account"}</Button>
      <p className="text-sm text-muted">Already registered? <Link href="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link></p>
    </Form>
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
