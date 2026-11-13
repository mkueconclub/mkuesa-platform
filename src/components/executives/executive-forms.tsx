"use client";

import { useActionState } from "react";
import { Form, Status } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  approveExecutiveAction,
  deleteExecutiveMessageAction,
  saveExecutiveContactAction,
  sendExecutiveMessageAction,
  setExecutiveMessageStatusAction,
} from "@/lib/executives/actions";
import type { FormState } from "@/lib/forms";

const initial: FormState = { ok: false, message: "" };

/** Visitor to officer. The message goes to that officer's own inbox only. */
export function ExecutiveMessageForm({ executiveId, officerName }: { executiveId: string; officerName: string }) {
  const [state, action, pending] = useActionState(sendExecutiveMessageAction, initial);
  if (state.ok) return <Status state={state} />;
  return (
    <Form action={action}>
      <input type="hidden" name="executiveId" value={executiveId} />
      <Input label="Your name" name="name" defaultValue={state.values?.name} autoComplete="name" required error={state.errors?.name} />
      <Input label="Your email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required error={state.errors?.email} hint={`${officerName} replies to this address.`} />
      <Input label="Subject" name="subject" defaultValue={state.values?.subject} required error={state.errors?.subject} />
      <Textarea label="Message" name="message" defaultValue={state.values?.message} required maxLength={2000} error={state.errors?.message} />
      {/* Honeypot: hidden from people and assistive technology; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : `Send to ${officerName}`}</Button>
    </Form>
  );
}

/** The officer's own contact details, shown on their public profile. */
export function ExecutiveContactForm({ email, bio }: { email: string; bio: string }) {
  const [state, action, pending] = useActionState(saveExecutiveContactAction, initial);
  return (
    <Form action={action}>
      <Input
        label="Contact email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email ?? email}
        error={state.errors?.email}
        hint="Shown on your public profile. Visitors can email you and can also write to you through the website."
      />
      <Textarea label="Short bio (optional)" name="bio" maxLength={1000} defaultValue={state.values?.bio ?? bio} error={state.errors?.bio} hint="Plain text, up to 1000 characters." />
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
    </Form>
  );
}

export function ExecutiveMessageStatusForm({ id, current }: { id: string; current: string }) {
  const [state, action, pending] = useActionState(setExecutiveMessageStatusAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="w-40">
        <Select
          label="Status"
          hideLabel
          name="status"
          defaultValue={current}
          options={[
            { value: "new", label: "New" },
            { value: "read", label: "Read" },
            { value: "replied", label: "Replied" },
            { value: "spam", label: "Spam" },
          ]}
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="h-11">{pending ? "Saving…" : "Update"}</Button>
      {state.message && !state.ok && <p role="alert" className="basis-full text-sm font-medium text-red-700">{state.message}</p>}
    </form>
  );
}

export function DeleteExecutiveMessageButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteExecutiveMessageAction, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Delete this message? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" disabled={pending} className="h-11 text-red-700 hover:bg-red-50">{pending ? "Deleting…" : "Delete"}</Button>
      {state.message && !state.ok && <p role="alert" className="text-sm font-medium text-red-700">{state.message}</p>}
    </form>
  );
}

export type AccountOption = { value: string; label: string };

/** Super Administrator: link the entry to the officer's account and approve it, or withdraw the approval. */
export function ExecutiveApprovalForm({ id, approved, accounts, currentProfileId }: { id: string; approved: boolean; accounts: readonly AccountOption[]; currentProfileId: string }) {
  const [state, action, pending] = useActionState(approveExecutiveAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={id} />
      <Select
        label="Officer's account"
        name="profileId"
        defaultValue={currentProfileId || ""}
        options={[{ value: "", label: "Choose an account…" }, ...accounts]}
        hint="Only accounts that already have an officer role are listed. Give the role first under Members."
      />
      <Status state={state} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="approve" disabled={pending}>{approved ? "Save account" : "Approve officer"}</Button>
        {approved && <Button type="submit" name="intent" value="withdraw" variant="outline" disabled={pending}>Withdraw approval</Button>}
      </div>
    </form>
  );
}
