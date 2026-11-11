import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/page-title";
import { ProfileForm } from "@/components/dashboard/member-forms";
import { Card } from "@/components/ui/card";
import { roleLabels } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDetailRow } from "@/types/database";

export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const base = await requireProfile("/dashboard/profile");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("phone, registration_number").eq("id", base.id).maybeSingle();
  const profile = { ...base, ...(data ?? { phone: null, registration_number: null }) } as ProfileDetailRow;

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="Your profile" description="Keep your details up to date. We only ask for what the association needs." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <ProfileForm
            defaults={{
              fullName: profile.full_name,
              phone: profile.phone ?? "",
              registrationNumber: profile.registration_number ?? "",
              programme: profile.programme ?? "",
              yearOfStudy: profile.year_of_study ? String(profile.year_of_study) : "",
            }}
          />
        </Card>
        <Card className="h-fit space-y-4">
          <h2 className="text-xl text-brand-900">Account</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-muted">Email</dt><dd className="break-all font-medium">{profile.email}</dd></div>
            <div><dt className="text-muted">Account type</dt><dd className="font-medium">{roleLabels[profile.role]}</dd></div>
          </dl>
          <p className="text-sm text-muted">
            Your email and account type cannot be changed here. To correct them, or to ask for your data to be corrected or deleted, use the{" "}
            <Link href="/contact" className="font-medium text-brand-700 underline">contact page</Link>. See the{" "}
            <Link href="/privacy" className="font-medium text-brand-700 underline">privacy notice</Link> for how your details are used.
          </p>
        </Card>
      </div>
    </>
  );
}
