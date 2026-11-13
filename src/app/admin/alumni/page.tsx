import type { Metadata } from "next";
import { PageTitle } from "@/components/dashboard/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leadershipRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { reviewAlumniAction } from "@/lib/alumni/review-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Alumni review", robots: { index: false, follow: false } };

function Decision({ kind, id }: { kind: "alumnus" | "opportunity"; id: string }) {
  return (
    <form action={reviewAlumniAction} className="flex gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" name="decision" value="approved">Approve</Button>
      <Button type="submit" name="decision" value="rejected" variant="outline">Reject</Button>
    </form>
  );
}

export default async function AdminAlumniPage() {
  await requireRole(leadershipRoles, "/admin/alumni");
  const supabase = await createClient();
  const [alumni, opps] = await Promise.all([
    supabase.from("alumni_profiles").select("id, graduation_year, organisation, position_title, profile:profiles!alumni_profiles_id_fkey(full_name, email)").eq("status", "pending"),
    supabase.from("opportunities").select("id, title, category, organisation, description, eligibility, deadline, apply_url, contact").eq("submission_status", "pending").order("created_at"),
  ]);
  type A = { id: string; graduation_year: number; organisation: string | null; position_title: string | null; profile: { full_name: string; email: string } | null };
  type O = { id: string; title: string; category: string; organisation: string | null; description: string; eligibility: string | null; deadline: string | null; apply_url: string | null; contact: string | null };
  return (
    <>
      <PageTitle eyebrow="Administration" title="Alumni review queue" description="Approving an opportunity publishes it on the Opportunities page immediately." />
      <div className="max-w-4xl space-y-8">
        <section aria-labelledby="a-h" className="space-y-3">
          <h2 id="a-h" className="text-2xl text-brand-900">Alumni profiles</h2>
          {((alumni.data ?? []) as unknown as A[]).map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{a.profile?.full_name} · Class of {a.graduation_year}</p>
                <p className="text-sm text-muted">{a.position_title ?? "-"} at {a.organisation ?? "-"} · {a.profile?.email}</p>
              </div>
              <Decision kind="alumnus" id={a.id} />
            </Card>
          ))}
          {!(alumni.data ?? []).length && <p className="text-muted">No profiles waiting.</p>}
        </section>
        <section aria-labelledby="o-h" className="space-y-3">
          <h2 id="o-h" className="text-2xl text-brand-900">Opportunities</h2>
          {((opps.data ?? []) as O[]).map((o) => (
            <Card key={o.id} className="space-y-3">
              <p className="font-semibold text-ink">{o.title} <span className="font-normal text-muted">· {o.category.replace(/_/g, " ")} · {o.organisation}</span></p>
              <p className="whitespace-pre-line text-sm text-muted">{o.description}</p>
              <dl className="grid gap-1 text-sm sm:grid-cols-2">
                <div><dt className="inline font-medium">Eligibility: </dt><dd className="inline">{o.eligibility ?? "-"}</dd></div>
                <div><dt className="inline font-medium">Deadline: </dt><dd className="inline">{o.deadline ? o.deadline.slice(0, 10) : "-"}</dd></div>
                <div><dt className="inline font-medium">Link: </dt><dd className="inline break-all">{o.apply_url ?? "-"}</dd></div>
                <div><dt className="inline font-medium">Contact: </dt><dd className="inline">{o.contact ?? "-"}</dd></div>
              </dl>
              <Decision kind="opportunity" id={o.id} />
            </Card>
          ))}
          {!(opps.data ?? []).length && <p className="text-muted">No opportunities waiting.</p>}
        </section>
      </div>
    </>
  );
}
