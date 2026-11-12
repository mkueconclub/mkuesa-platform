"use client";

import { useActionState } from "react";
import { Form, Status } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";
import { cancelRegistrationAction, registerForEventAction, submitResearchAction, updateProfileAction, withdrawResearchAction } from "@/lib/member/actions";

const initial: FormState = { ok: false, message: "" };

export function ProfileForm({
  defaults,
}: {
  defaults: { fullName: string; phone: string; registrationNumber: string; programme: string; yearOfStudy: string };
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  // After a submit the server echoes what was typed; before the first submit we show the saved values.
  const v = state.values ?? defaults;
  return (
    <Form action={action}>
      <Input label="Full name" name="fullName" autoComplete="name" required defaultValue={v.fullName} error={state.errors?.fullName} />
      <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} hint="Digits, spaces, + ( ) and - only." error={state.errors?.phone} />
      <Input
        label="Student registration number (optional)"
        name="registrationNumber"
        defaultValue={v.registrationNumber}
        hint="Only needed for certificates and membership checks."
        error={state.errors?.registrationNumber}
      />
      <Input label="Programme (optional)" name="programme" defaultValue={v.programme} error={state.errors?.programme} />
      <Input label="Year of study (optional)" name="yearOfStudy" type="number" min={1} max={8} inputMode="numeric" defaultValue={v.yearOfStudy} error={state.errors?.yearOfStudy} />
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </Form>
  );
}

export function RegisterEventButton({ eventId, label = "Register" }: { eventId: string; label?: string }) {
  const [state, action, pending] = useActionState(registerForEventAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : label}</Button>
      <Status state={state} />
    </form>
  );
}

export function CancelRegistrationButton({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(cancelRegistrationAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Cancelling…" : "Cancel registration"}</Button>
      <Status state={state} />
    </form>
  );
}

export function ResearchForm({ defaultAuthor }: { defaultAuthor: string }) {
  const [state, action, pending] = useActionState(submitResearchAction, initial);
  const v = state.values ?? { authorName: defaultAuthor };
  return (
    <Form action={action}>
      <Input label="Title" name="title" required maxLength={250} defaultValue={v.title} error={state.errors?.title} />
      <Input label="Author name(s)" name="authorName" required maxLength={120} defaultValue={v.authorName} hint="Shown with your work if it is published." error={state.errors?.authorName} />
      <Textarea label="Abstract" name="abstract" required maxLength={3000} defaultValue={v.abstract} hint="A summary of 50 to 3,000 characters: the question, the method and what you found." error={state.errors?.abstract} className="min-h-32" />
      <Textarea label="Full text (optional)" name="body" maxLength={100000} defaultValue={v.body} hint="Plain text. File uploads are not available yet." error={state.errors?.body} className="min-h-56" />
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit for review"}</Button>
    </Form>
  );
}

export function WithdrawResearchButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(withdrawResearchAction, initial);
  return (
    <form
      action={action}
      className="space-y-2"
      onSubmit={(e) => {
        if (!window.confirm("Withdraw this submission? It will be deleted.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" disabled={pending} className="h-9 px-3">{pending ? "Withdrawing…" : "Withdraw"}</Button>
      <Status state={state} />
    </form>
  );
}
