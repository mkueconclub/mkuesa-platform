"use client";

import { useActionState } from "react";
import { Status } from "@/components/auth/auth-forms";
import { AButton } from "@/components/alumni/ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction, createReplyAction } from "@/lib/alumni/connect-actions";
import type { FormState } from "@/lib/forms";
import { connectTopics } from "@/lib/validation/alumni";

const initial: FormState = { ok: false, message: "" };
const fields = "space-y-4 [&_input]:h-12 [&_input]:rounded-xl [&_textarea]:rounded-xl [&_select]:h-12 [&_select]:rounded-xl [&_label]:font-semibold";

export function PostForm() {
  const [state, action, pending] = useActionState(createPostAction, initial);
  const v = state.ok ? {} : (state.values ?? {});
  const e = state.errors;
  return (
    <form action={action} noValidate className={fields}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Topic" name="topic" required defaultValue={v.topic ?? "idea"} options={connectTopics} error={e?.topic} />
        <div className="sm:col-span-2"><Input label="Title" name="title" required defaultValue={v.title} error={e?.title} /></div>
      </div>
      <Textarea label="Share your idea or question" name="body" rows={4} required defaultValue={v.body} error={e?.body} />
      <Status state={state} />
      <AButton type="submit" disabled={pending}>{pending ? "Posting…" : "Post to Alumni Connect"}</AButton>
    </form>
  );
}

export function ReplyForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(createReplyAction, initial);
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={action} noValidate className={fields}>
      <input type="hidden" name="postId" value={postId} />
      <Textarea label="Your reply" name="body" rows={3} required defaultValue={v.body} error={state.errors?.body} />
      <Status state={state} />
      <AButton type="submit" disabled={pending}>{pending ? "Posting…" : "Reply"}</AButton>
    </form>
  );
}
