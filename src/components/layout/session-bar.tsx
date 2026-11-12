"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { roleBadgeLabels, staffRoles } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

/**
 * Slim bar above the header, shown only while signed in: who you are and what role you hold
 * (Master Admin, Treasurer, Member...). It is for orientation only; real access is enforced by the server.
 */
export function SessionBar() {
  const auth = useAuth();
  const router = useRouter();
  if (auth.status !== "in") return null;

  async function signOut() {
    // Signing out in the browser clears the session cookie and updates this bar straight away.
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const staff = staffRoles.includes(auth.role);
  const master = auth.role === "super_admin";

  return (
    <div className="bg-brand-950 text-ivory print:hidden" role="region" aria-label="Your session">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 text-sm sm:px-6 lg:px-8">
        <p className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
              master ? "bg-accent-400 text-brand-950" : staff ? "bg-accent-100 text-accent-800" : "bg-brand-100 text-brand-900",
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {roleBadgeLabels[auth.role]}
          </span>
          <span className="truncate">
            <span className="sr-only">Signed in as </span>
            {auth.name}
          </span>
        </p>
        <nav aria-label="Account" className="flex items-center gap-4">
          {staff && <Link href="/admin" className="font-medium hover:underline">Administration</Link>}
          <Link href="/dashboard" className="font-medium hover:underline">{staff ? "Member portal" : "Dashboard"}</Link>
          <button type="button" onClick={signOut} className="font-medium underline-offset-2 hover:underline">Sign out</button>
        </nav>
      </div>
    </div>
  );
}
