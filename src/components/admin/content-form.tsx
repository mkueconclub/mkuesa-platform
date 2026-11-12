"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Form, Status } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteContentAction, saveContentAction } from "@/lib/admin/actions";
import type { Field } from "@/lib/admin/content-config";
import type { FormState } from "@/lib/forms";

const initialState: FormState = { ok: false, message: "" };

type Props = {
  kind: string;
  fields: readonly Field[];
  initial: Record<string, string>;
  id?: string;
  /** Limits the Status choices (editors who may only save drafts). */
  allowedStatuses?: readonly string[];
  cancelHref: string;
  submitLabel: string;
};

/** One form for every kind of managed content, driven by the field list. */
export function ContentForm({ kind, fields, initial, id, allowedStatuses, cancelHref, submitLabel }: Props) {
  const [state, action, pending] = useActionState(saveContentAction, initialState);
  const src = state.values ?? initial; // after a submit the server echoes what was typed
  return (
    <Form action={action}>
      <input type="hidden" name="kind" value={kind} />
      {id && <input type="hidden" name="id" value={id} />}
      {fields.map((f) => {
        const error = state.errors?.[f.name];
        const required = f.required ? true : undefined;
        if (f.type === "checkbox") {
          return (
            <label key={f.name} className="flex items-start gap-3 text-sm">
              <input type="checkbox" name={f.name} defaultChecked={src[f.name] === "on"} className="mt-1 size-4 accent-brand-700" />
              <span>{f.label}</span>
            </label>
          );
        }
        if (f.type === "textarea") {
          return <Textarea key={f.name} label={f.label} name={f.name} required={required} hint={f.hint} maxLength={f.max} defaultValue={src[f.name]} error={error} className="min-h-40" />;
        }
        if (f.type === "select") {
          const options = f.name === "status" && allowedStatuses ? (f.options ?? []).filter((o) => allowedStatuses.includes(o.value)) : (f.options ?? []);
          return <Select key={f.name} label={f.label} name={f.name} options={options} hint={f.hint} defaultValue={src[f.name] ?? options[0]?.value} error={error} />;
        }
        const type = f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : f.type === "url" ? "url" : "text";
        return (
          <Input
            key={f.name}
            label={f.label}
            name={f.name}
            type={type}
            required={required}
            hint={f.hint}
            min={f.type === "number" ? f.min : undefined}
            max={f.type === "number" ? f.max : undefined}
            maxLength={f.type === "text" || f.type === "url" ? f.max : undefined}
            defaultValue={src[f.name]}
            error={error}
          />
        );
      })}
      <Status state={state} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
        <Button href={cancelHref} variant="ghost">Cancel</Button>
      </div>
    </Form>
  );
}

export function DeleteContentButton({ kind, id, label }: { kind: string; id: string; label: string }) {
  const [state, action, pending] = useActionState(deleteContentAction, initialState);
  return (
    <form
      action={action}
      className="space-y-2"
      onSubmit={(e) => {
        if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" disabled={pending} className="border-red-700 text-red-700 hover:bg-red-50">{pending ? "Deleting…" : `Delete ${label}`}</Button>
      <Status state={state} />
    </form>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="text-sm font-medium text-brand-700 hover:underline">{children}</Link>;
}
