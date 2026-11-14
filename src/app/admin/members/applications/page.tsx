import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewMembershipForm } from "@/components/admin/admin-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { currentAcademicYear } from "@/config/association";
import { can } from "@/lib/auth/permissions";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import type { MembershipStatus } from "@/types/database";

export const metadata: Metadata = { title: "Applications (admin)", robots: { index: false, follow: false } };

const tabs: { value: MembershipStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

type Row = {
  id: string;
  status: MembershipStatus;
  academic_year: string;
  motivation: string | null;
  applied_at: string;
  membership_number: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  profile: { full_name: string; email: string; programme: string | null; year_of_study: number | null } | null;
};

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string; year?: string }> }) {
  const me = await requireRole(staffRoles, "/admin/members/applications");
  if (!can.readMembers(me.role) && !can.reviewApplications(me.role)) notFound();
  const sp = await searchParams;
  const status = tabs.some((t) => t.value === sp.status) ? (sp.status as MembershipStatus | "all") : "pending";
  const year = /^\d{4}\/\d{4}$/.test(sp.year ?? "") ? (sp.year as string) : currentAcademicYear;
  const canReview = can.reviewApplications(me.role);

  const supabase = await createClient();
  // memberships has two links to profiles (the applicant and the reviewer), so the applicant is named explicitly.
  let query = supabase
    .from("memberships")
    .select("id, status, academic_year, motivation, applied_at, membership_number, expires_at, rejection_reason, profile:profiles!profile_id(full_name, email, programme, year_of_study)")
    .eq("academic_year", year)
    .order("applied_at", { ascending: status === "pending" })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageTitle eyebrow="Administration" title="Membership applications" description={`Academic year ${year}.`} />
      <div className="space-y-6">
        {!canReview && <Notice tone="pending">Your role can view applications. The Chairperson, Treasurer, Membership Coordinator and Super Administrator make the decisions.</Notice>}
        {error && <Notice>Could not load applications. Please try again.</Notice>}
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.value}
              href={`/admin/members/applications?status=${t.value}`}
              aria-current={t.value === status ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${t.value === status ? "bg-brand-700 text-white" : "bg-paper text-brand-800 hover:bg-brand-50"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {rows.length ? (
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl text-brand-900">{r.profile?.full_name ?? "Unknown applicant"}</h2>
                      <p className="break-all text-sm text-muted">{r.profile?.email}</p>
                      <p className="text-sm text-muted">{[r.profile?.programme, r.profile?.year_of_study ? `Year ${r.profile.year_of_study}` : null].filter(Boolean).join(" · ") || "No programme given"} · applied {formatDay(r.applied_at)}</p>
                    </div>
                    <Badge tone={r.status === "approved" ? "brand" : "neutral"} className="capitalize">{r.status}{r.membership_number ? ` · ${r.membership_number}` : ""}</Badge>
                  </div>
                  {r.motivation && <p className="whitespace-pre-line break-words rounded-md bg-ivory p-3 text-sm">{r.motivation}</p>}
                  {r.rejection_reason && <p className="text-sm text-muted">Reason given: {r.rejection_reason}</p>}
                  {canReview && <ReviewMembershipForm id={r.id} current={r.status} />}
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card><p className="text-muted">No {status === "all" ? "" : `${status} `}applications for {year}.</p></Card>
        )}
      </div>
    </>
  );
}
