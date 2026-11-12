import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleForm } from "@/components/admin/admin-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { currentAcademicYear } from "@/config/association";
import { can } from "@/lib/auth/permissions";
import { isUserRole, roleLabels, staffRoles, userRoles, type UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Members (admin)", robots: { index: false, follow: false } };

const PAGE = 25;
type P = { id: string; full_name: string; email: string; programme: string | null; year_of_study: number | null; role: UserRole; created_at: string };

/** Keeps characters that could change the meaning of a search filter out of the query. */
const cleanQuery = (q: string | undefined) => (q ?? "").replace(/[^\p{L}\p{N}@.\-_ ]/gu, "").trim().slice(0, 60);

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const me = await requireRole(staffRoles, "/admin/members");
  if (!can.readMembers(me.role)) notFound();
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const roleFilter = isUserRole(sp.role) ? sp.role : undefined;
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.page ?? "1", 10) || 1));

  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, full_name, email, programme, year_of_study, role, created_at", { count: "exact" });
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  if (roleFilter) query = query.eq("role", roleFilter);
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const people = (data ?? []) as P[];

  const { data: mems } = people.length
    ? await supabase.from("memberships").select("profile_id, status, membership_number").eq("academic_year", currentAcademicYear).in("profile_id", people.map((p) => p.id))
    : { data: [] };
  const memberOf = new Map((mems ?? []).map((m) => [m.profile_id as string, m as { status: string; membership_number: string | null }]));

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => `/admin/members?${new URLSearchParams({ ...(q && { q }), ...(roleFilter && { role: roleFilter }), page: String(p) })}`;
  const canChangeRoles = can.changeRoles(me.role);

  return (
    <>
      <PageTitle eyebrow="Administration" title="Members" description={`${total} account${total === 1 ? "" : "s"}. Membership shown is for ${currentAcademicYear}.`} />
      <div className="space-y-6">
        <Card>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="q" className="mb-1.5 block text-sm font-medium">Search name or email</label>
              <input id="q" name="q" defaultValue={q} className="h-11 w-full rounded-md border border-brand-200 bg-paper px-3" />
            </div>
            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium">Role</label>
              <select id="role" name="role" defaultValue={roleFilter ?? ""} className="h-11 rounded-md border border-brand-200 bg-paper px-3">
                <option value="">All roles</option>
                {userRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
            </div>
            <Button type="submit">Search</Button>
          </form>
        </Card>

        {people.length ? (
          <ul className="space-y-4">
            {people.map((p) => {
              const m = memberOf.get(p.id);
              return (
                <li key={p.id}>
                  <Card className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl text-brand-900">{p.full_name}</h2>
                        <p className="break-all text-sm text-muted">{p.email}</p>
                        <p className="text-sm text-muted">{[p.programme, p.year_of_study ? `Year ${p.year_of_study}` : null].filter(Boolean).join(" · ") || "No programme given"} · joined {formatDay(p.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={p.role === "member" ? "neutral" : "accent"}>{roleLabels[p.role]}</Badge>
                        {m ? <Badge tone={m.status === "approved" ? "brand" : "neutral"} className="capitalize">{m.status}{m.membership_number ? ` · ${m.membership_number}` : ""}</Badge> : <Badge tone="neutral">No application</Badge>}
                      </div>
                    </div>
                    {canChangeRoles && p.id !== me.id && <RoleForm target={p.id} current={p.role} />}
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <Card><p className="text-muted">No one matches that search.</p></Card>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-between text-sm">
            {page > 1 ? <Link href={link(page - 1)} className="font-medium text-brand-700 hover:underline">← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={link(page + 1)} className="font-medium text-brand-700 hover:underline">Next →</Link> : <span />}
          </nav>
        )}
      </div>
    </>
  );
}
