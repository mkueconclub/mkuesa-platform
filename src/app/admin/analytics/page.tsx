import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart, BarList } from "@/components/charts/bar-chart";
import { PageTitle } from "@/components/dashboard/page-title";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { parseAnalytics } from "@/lib/admin/analytics";
import { can } from "@/lib/auth/permissions";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { percent } from "@/lib/charts/scale";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Analytics (admin)", robots: { index: false, follow: false } };

export default async function AnalyticsPage() {
  const me = await requireRole(staffRoles, "/admin/analytics");
  if (!can.readAnalytics(me.role)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_analytics");
  const a = error ? null : parseAnalytics(data);
  if (error) console.error("admin_analytics failed:", error.code, error.message);

  return (
    <>
      <PageTitle eyebrow="Administration" title="Analytics" description="Counts only, computed by the database. No individual is identifiable here: programmes with fewer than 3 members are grouped together." />
      {!a ? (
        <Notice>Analytics could not be loaded. If you have just updated the code, make sure the Phase 6 database migration has been applied.</Notice>
      ) : (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-2xl text-brand-900">Membership applications</h2>
            <BarChart
              title="Applications and approvals per month, last 12 months"
              labels={a.applications_by_month.map((m) => m.month)}
              series={[
                { name: "Applied", values: a.applications_by_month.map((m) => m.applied), fill: "fill-brand-300", swatch: "bg-brand-300" },
                { name: "Now approved", values: a.applications_by_month.map((m) => m.approved), fill: "fill-brand-700", swatch: "bg-brand-700" },
              ]}
            />
            <p className="mt-3 text-sm text-muted">Months are by the date of application (Nairobi time). &ldquo;Now approved&rdquo; counts applications from that month that are approved today.</p>
          </Card>

          <Card>
            <h2 className="mb-1 text-2xl text-brand-900">Event participation</h2>
            <p className="mb-5 text-sm text-muted">The 12 most recent finished events. The dark part of each bar is the share who attended.</p>
            {a.events.length ? (
              <BarList
                max={Math.max(1, ...a.events.map((e) => Math.max(e.signed_up, e.capacity ?? 0)))}
                rows={[...a.events].reverse().map((e) => ({
                  label: e.title,
                  sublabel: formatDay(e.starts_at),
                  value: e.signed_up,
                  secondary: e.attended,
                  note: `${e.signed_up} signed up, ${e.attended} attended (${percent(e.attended, e.signed_up)}%)${e.capacity ? `, capacity ${e.capacity}` : ""}${e.waitlisted ? `, ${e.waitlisted} were on the waiting list` : ""}.`,
                }))}
                valueLabel={(r) => `${r.secondary ?? 0} / ${r.value}`}
              />
            ) : (
              <p className="text-muted">No finished events with sign-ups yet. Attendance appears here once events have been held and marked.</p>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-2xl text-brand-900">Members by year of study</h2>
              {a.members_by_year.length ? (
                <BarChart title="Approved members by year of study" labels={a.members_by_year.map((m) => m.label)} series={[{ name: "Members", values: a.members_by_year.map((m) => m.count), fill: "fill-brand-600", swatch: "bg-brand-600" }]} formatLabel={(l) => l.replace("Year ", "Yr ")} />
              ) : (
                <p className="text-muted">No approved members yet.</p>
              )}
            </Card>
            <Card>
              <h2 className="mb-4 text-2xl text-brand-900">Members by programme</h2>
              {a.programmes.length ? <BarList rows={a.programmes.map((p) => ({ label: p.label, value: p.count }))} /> : <p className="text-muted">No approved members yet.</p>}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
