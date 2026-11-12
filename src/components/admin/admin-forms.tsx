"use client";

import { useActionState } from "react";
import { Form, Status } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { certificateTypes } from "@/lib/admin/content-config";
import {
  changeRoleAction,
  issueCertificateAction,
  markAttendedAction,
  reviewMembershipAction,
  revokeCertificateAction,
  setMessageStatusAction,
} from "@/lib/admin/actions";
import { roleLabels, userRoles, type UserRole } from "@/lib/auth/roles";
import type { FormState } from "@/lib/forms";

const initial: FormState = { ok: false, message: "" };
const statusOptions = [
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
];

export function ReviewMembershipForm({ id, current }: { id: string; current: string }) {
  const [state, action, pending] = useActionState(reviewMembershipAction, initial);
  const v = state.values;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={id} />
      <Select label="Set status" name="status" options={statusOptions} defaultValue={v?.status ?? (current === "pending" ? "approved" : current)} />
      <Input label="Expires on (approved only, optional)" name="expiresAt" type="date" defaultValue={v?.expiresAt} error={state.errors?.expiresAt} />
      <div className="sm:col-span-2">
        <Input label="Reason (required when rejecting; the applicant sees it)" name="reason" maxLength={300} defaultValue={v?.reason} error={state.errors?.reason} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Status state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save decision"}</Button>
      </div>
    </form>
  );
}

export function RoleForm({ target, current }: { target: string; current: UserRole }) {
  const [state, action, pending] = useActionState(changeRoleAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="target" value={target} />
      <div className="min-w-48 flex-1">
        <Select label="Role" hideLabel name="role" defaultValue={current} options={userRoles.map((r) => ({ value: r, label: roleLabels[r] }))} />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Saving…" : "Change role"}</Button>
      {state.message && <p role={state.ok ? "status" : "alert"} className={`basis-full text-sm ${state.ok ? "text-brand-800" : "font-medium text-red-700"}`}>{state.message}</p>}
    </form>
  );
}

export function IssueCertificateForm({ events }: { events: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(issueCertificateAction, initial);
  const v = state.values;
  return (
    <Form action={action}>
      <Input label="Holder's email address" name="email" type="email" required defaultValue={v?.email} hint="They must already have an account." error={state.errors?.email} />
      <Input label="Certificate title" name="title" required maxLength={200} defaultValue={v?.title} error={state.errors?.title} />
      <Select label="Type" name="certificateType" defaultValue={v?.certificateType ?? "participation"} options={certificateTypes.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} error={state.errors?.certificateType} />
      <Select label="Linked event (optional)" name="eventId" defaultValue={v?.eventId ?? ""} options={[{ value: "", label: "None" }, ...events.map((e) => ({ value: e.id, label: e.title }))]} error={state.errors?.eventId} />
      <Status state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue certificate"}</Button>
    </Form>
  );
}

export function RevokeCertificateForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeCertificateAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="min-w-48 flex-1"><Input label="Reason for revoking" name="reason" required maxLength={300} defaultValue={state.values?.reason} error={state.errors?.reason} /></div>
      <Button type="submit" variant="outline" disabled={pending} className="border-red-700 text-red-700 hover:bg-red-50">{pending ? "Revoking…" : "Revoke"}</Button>
      {state.message && !state.errors && <p role={state.ok ? "status" : "alert"} className={`basis-full text-sm ${state.ok ? "text-brand-800" : "font-medium text-red-700"}`}>{state.message}</p>}
    </form>
  );
}

export function MarkAttendedButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(markAttendedAction, initial);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" disabled={pending} className="h-9 px-3">{pending ? "Saving…" : "Mark attended"}</Button>
      {state.message && !state.ok && <p role="alert" className="text-xs font-medium text-red-700">{state.message}</p>}
    </form>
  );
}

export function MessageStatusForm({ id, current, canEdit }: { id: string; current: string; canEdit: boolean }) {
  const [state, action, pending] = useActionState(setMessageStatusAction, initial);
  if (!canEdit) return null;
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
