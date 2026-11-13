import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/dashboard/page-title";
import { Card } from "@/components/ui/card";
import { can } from "@/lib/auth/permissions";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Audit log (admin)", robots: { index: false, follow: false } };

const ENTITIES = ["memberships", "profiles", "announcements", "events", "resources", "research_publications", "opportunities", "certificates", "executive_positions"] as const;

type Row = { id: string; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string; actor: { full_name: string } | null };

function describe(m: Record<string, unknown>): string {
  const parts: string[] = [];
  if (m.status_old || m.status_new) parts.push(`${m.status_old ?? "none"} → ${m.status_new ?? "none"}`);
  if (m.role_old || m.role_new) parts.push(`${m.role_old} → ${m.role_new}`);
  return parts.join(", ");
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  const me = await requireRole(staffRoles, "/admin/audit");
  if (!can.readAudit(me.role)) notFound();
  const { entity } = await searchParams;
  const filter = ENTITIES.find((e) => e === entity);

  const supabase = await createClient();
  let query = supabase.from("audit_logs").select("id, action, entity_type, entity_id, metadata, created_at, actor:profiles(full_name)").order("created_at", { ascending: false }).limit(100);
  if (filter) query = query.eq("entity_type", filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageTitle eyebrow="Administration" title="Audit log" description="A record of important changes, written by the database itself. Nobody can edit or delete these entries from the website. Showing the latest 100." />
      <div className="space-y-6">
        <nav aria-label="Filter by area" className="flex flex-wrap gap-2">
          {[undefined, ...ENTITIES].map((e) => (
            <Link key={e ?? "all"} href={e ? `/admin/audit?entity=${e}` : "/admin/audit"} aria-current={e === filter ? "page" : undefined} className={`rounded-full px-3 py-1 text-sm font-medium ${e === filter ? "bg-brand-700 text-white" : "bg-paper text-brand-800 hover:bg-brand-50"}`}>
              {e ? e.replace(/_/g, " ") : "All"}
            </Link>
          ))}
        </nav>
        <Card className="p-0">
          {rows.length ? (
            <div className="scroll-x">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-brand-100 text-muted">
                  <tr><th scope="col" className="px-4 py-3 font-medium">When</th><th scope="col" className="px-4 py-3 font-medium">Who</th><th scope="col" className="px-4 py-3 font-medium">Action</th><th scope="col" className="px-4 py-3 font-medium">Detail</th></tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-4 py-3 align-top">{formatEventDate(r.created_at)}</td>
                      <td className="px-4 py-3 align-top">{r.actor?.full_name ?? "System"}</td>
                      <td className="px-4 py-3 align-top font-mono text-xs">{r.action}</td>
                      <td className="px-4 py-3 align-top text-muted">{describe(r.metadata)}{r.entity_id ? <span className="block break-all font-mono text-xs">{r.entity_id}</span> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-muted">No entries yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
