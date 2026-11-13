import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Email verified" };

/** Shown after the confirmation link in the sign-up email has been opened. */
export default async function EmailVerifiedPage() {
  // Only people who just confirmed (and are therefore signed in) should see this message.
  if (!isSupabaseConfigured() || !(await getCurrentUser())) redirect("/login");
  return (
    <AuthCard title="Email verified" description="Thank you. Your email address is confirmed and your MKUESA account is active.">
      <div className="flex flex-col gap-3">
        <Button href="/dashboard" className="w-full">Go to my dashboard</Button>
        <Button href="/membership" variant="outline" className="w-full">How to join MKUESA</Button>
      </div>
    </AuthCard>
  );
}
