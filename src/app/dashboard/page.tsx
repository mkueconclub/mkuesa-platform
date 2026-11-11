import type { Metadata } from "next";
import Link from "next/link";
import { ApplyMembershipForm } from "@/components/auth/auth-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { currentAcademicYear } from "@/config/association";
import { logoutAction } from "@/lib/auth/actions";
import { roleLabels, staffRoles } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRow } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const statusText: Record<MembershipRow["status"], string> = {
  pending: "Your application is awaiting review by the membership team.",
  approved: "Your membership is active.",
  rejected: "Your application was not approved.",
  suspended: "Your membership is suspended. Please contact the association.",
  expired: "Your membership has expired.",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const profile = await requireProfile("/dashboard");
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("status, academic_year, membership_number, rejection_reason")
    .eq("profile_id", profile.id)
    .eq("academic_year", currentAcademicYear)
    .maybeSingle();
  const membership = data as MembershipRow | null;

  return (
    <Section eyebrow="Member dashboard" title={`Welcome, ${profile.full_name.split(" ")[0]}`}>
      <div className="space-y-6">
        {denied && <Notice>You do not have access to that area.</Notice>}

        <Card>
          <h2 className="text-2xl text-brand-900">Membership {currentAcademicYear}</h2>
          {membership ? (
            <div className="mt-3 space-y-2">
              <Badge tone={membership.status === "approved" ? "brand" : "neutral"}>{membership.status}</Badge>
              <p>{statusText[membership.status]}</p>
              {membership.membership_number && <p className="text-muted">Membership number: {membership.membership_number}</p>}
              {membership.status === "rejected" && membership.rejection_reason && <p className="text-muted">Reason: {membership.rejection_reason}</p>}
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <p className="text-muted">You have not applied for this academic year yet.</p>
              <ApplyMembershipForm academicYear={currentAcademicYear} />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl text-brand-900">Your details</h2>
          <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-sm text-muted">Name</dt><dd>{profile.full_name}</dd></div>
            <div><dt className="text-sm text-muted">Email</dt><dd>{profile.email}</dd></div>
            <div><dt className="text-sm text-muted">Programme</dt><dd>{profile.programme ?? "Not provided"}</dd></div>
            <div><dt className="text-sm text-muted">Year of study</dt><dd>{profile.year_of_study ?? "Not provided"}</dd></div>
            <div><dt className="text-sm text-muted">Account type</dt><dd>{roleLabels[profile.role]}</dd></div>
          </dl>
          <p className="mt-4 text-sm text-muted">Profile editing, event registration, resources and certificates arrive in Phase 4.</p>
        </Card>

        <div className="flex flex-wrap gap-3">
          {staffRoles.includes(profile.role) && <Button href="/admin">Administration</Button>}
          <Link href="/" className="inline-flex h-11 items-center px-3 text-sm font-medium text-brand-700 hover:underline">Back to the website</Link>
          <form action={logoutAction}><Button type="submit" variant="outline">Sign out</Button></form>
        </div>
      </div>
    </Section>
  );
}
