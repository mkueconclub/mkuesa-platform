import type { Metadata } from "next";
import { ApplyMembershipForm } from "@/components/auth/auth-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { currentAcademicYear } from "@/config/association";
import { requireProfile } from "@/lib/auth/session";
import { currentMembership, getMemberships, membershipStatusText } from "@/lib/member/queries";

export const metadata: Metadata = { title: "Membership", robots: { index: false, follow: false } };

const dateFmt = new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" });

export default async function MembershipPage() {
  const profile = await requireProfile("/dashboard/membership");
  const memberships = await getMemberships(profile.id);
  const current = currentMembership(memberships);

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="Membership" description="Your application status and membership history." />
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-2xl text-brand-900">Academic year {currentAcademicYear}</h2>
            {current && <Badge tone={current.status === "approved" ? "brand" : "neutral"}>{current.status}</Badge>}
          </div>
          {current ? (
            <div className="mt-3 space-y-2">
              <p>{membershipStatusText[current.status]}</p>
              <p className="text-sm text-muted">Applied on {dateFmt.format(new Date(current.applied_at))}.</p>
              {current.membership_number && <p className="text-muted">Membership number: <span className="font-medium text-ink">{current.membership_number}</span></p>}
              {current.expires_at && <p className="text-muted">Valid until {dateFmt.format(new Date(current.expires_at))}.</p>}
              {current.status === "rejected" && current.rejection_reason && <p className="text-muted">Reason given: {current.rejection_reason}</p>}
              {current.status === "rejected" && <Notice tone="pending">If you think this is a mistake, please get in touch through the contact page.</Notice>}
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <p className="text-muted">You have not applied for this academic year yet. Tell us briefly why you would like to join; this is optional.</p>
              <ApplyMembershipForm academicYear={currentAcademicYear} />
            </div>
          )}
        </Card>

        {memberships.length > 1 && (
          <Card>
            <h2 className="text-2xl text-brand-900">History</h2>
            <ul className="mt-4 divide-y divide-brand-100">
              {memberships.map((m) => (
                <li key={m.academic_year} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="font-medium">{m.academic_year}</span>
                  <span className="flex items-center gap-3 text-sm text-muted">
                    {m.membership_number}
                    <Badge tone={m.status === "approved" ? "brand" : "neutral"}>{m.status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
