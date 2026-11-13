"use client";

import { useActionState } from "react";
import { AButton } from "@/components/alumni/ui";
import { toggleFollowAction } from "@/lib/alumni/connect-actions";
import type { FormState } from "@/lib/forms";

const initial: FormState = { ok: false, message: "" };

export function FollowButton({ alumnusId, following }: { alumnusId: string; following: boolean }) {
  const [state, action, pending] = useActionState(toggleFollowAction, initial);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="alumnusId" value={alumnusId} />
      <input type="hidden" name="intent" value={following ? "unfollow" : "follow"} />
      <AButton type="submit" variant={following ? "soft" : "solid"} disabled={pending} aria-pressed={following}>
        {pending ? "…" : following ? "Following" : "Follow"}
      </AButton>
      {state.message && !state.ok && <p role="alert" className="text-xs font-medium text-red-700">{state.message}</p>}
    </form>
  );
}
