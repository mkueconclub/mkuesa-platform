import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, ContentForm, DeleteContentButton } from "@/components/admin/content-form";
import { MarkAttendedButton } from "@/components/admin/admin-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { contentConfigs, type ContentConfig, type Field } from "@/lib/admin/content-config";
import { can, contentPermissions, type ContentKind } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { roleLabels, staffRoles } from "@/lib/auth/roles";
import { fitPosterText } from "@/lib/poster/layout";
import { createClient } from "@/lib/supabase/server";
import { formatDay, formatEventDate, toNairobiInput } from "@/lib/utils/date";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const human = (v: unknown) => String(v).replace(/_/g, " ");

/** The committee's approval flag is changed on its own card by the Super Administrator, so it is not a form field. */
const formFields = (cfg: ContentConfig) => cfg.fields.filter((f) => !(cfg.kind === "committee" && f.name === "public_consent"));

type Row = Record<string, unknown>;

function cell(type: string | undefined, value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="text-muted">-</span>;
  if (type === "badge") return <Badge tone={value === "published" ? "brand" : "neutral"} className="capitalize">{human(value)}</Badge>;
  if (type === "date") return formatDay(String(value));
  return String(value);
}

function toInitial(fields: readonly Field[], row: Row): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = row[f.name];
    if (f.type === "checkbox") out[f.name] = v ? "on" : "";
    else if (f.type === "datetime") out[f.name] = toNairobiInput(v as string | null);
    else if (f.type === "tags") out[f.name] = Array.isArray(v) ? v.join(", ") : "";
    else out[f.name] = v === null || v === undefined ? "" : String(v);
  }
  return out;
}

export async function ContentListPage({ kind, searchParams }: { kind: ContentKind; searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const cfg: ContentConfig = contentConfigs[kind];
  const profile = await requireRole(staffRoles, cfg.basePath);
  const perms = contentPermissions(kind, profile.role);
  if (!perms.read) notFound();
  const { saved, deleted } = await searchParams;
  const showPoster = kind === "announcements" && can.downloadPoster(profile.role);

  const supabase = await createClient();
  const columns = ["id", cfg.titleField, ...cfg.list.map((c) => c.field)];
  const { data, error } = await supabase
    .from(cfg.table)
    .select([...new Set(columns)].join(", "))
    .order(cfg.orderBy.column, { ascending: cfg.orderBy.ascending })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageTitle eyebrow="Administration" title={cfg.label} description={cfg.description} />
      <div className="space-y-6">
        {saved && <Notice tone="pending">Saved.</Notice>}
        {deleted && <Notice tone="pending">Deleted.</Notice>}
        {error && <Notice>Could not load this list. Please try again.</Notice>}
        {!perms.write && <Notice tone="pending">Your role can view this list but not change it.</Notice>}
        {perms.draftOnly && <Notice tone="pending">Your role can create drafts. A Chairperson or other officer publishes them.</Notice>}
        {perms.write && <div><Button href={`${cfg.basePath}/new`}>New {cfg.singular}</Button></div>}

        <Card className="p-0">
          {rows.length ? (
            <div className="scroll-x">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="border-b border-brand-100 text-muted">
                  <tr>
                    {cfg.list.map((c) => <th key={c.field} scope="col" className="px-4 py-3 font-medium">{c.label}</th>)}
                    {showPoster && <th scope="col" className="px-4 py-3 font-medium">Poster</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {rows.map((r) => (
                    <tr key={String(r.id)}>
                      {cfg.list.map((c, i) => (
                        <td key={c.field} className="px-4 py-3 align-top">
                          {i === 0 ? <Link href={`${cfg.basePath}/${r.id}`} className="font-medium text-brand-700 hover:underline">{String(r[c.field])}</Link> : cell(c.type, r[c.field])}
                        </td>
                      ))}
                      {showPoster && (
                        <td className="px-4 py-3 align-top">
                          <a href={`${cfg.basePath}/${r.id}/poster`} download className="font-medium text-brand-700 hover:underline">Download</a>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-muted">Nothing here yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}

export async function ContentNewPage({ kind }: { kind: ContentKind }) {
  const cfg = contentConfigs[kind];
  const profile = await requireRole(staffRoles, `${cfg.basePath}/new`);
  const perms = contentPermissions(kind, profile.role);
  return (
    <>
      <BackLink href={cfg.basePath}>← {cfg.label}</BackLink>
      <div className="mt-4"><PageTitle eyebrow="Administration" title={`New ${cfg.singular}`} /></div>
      {perms.write ? (
        <Card>
          <ContentForm kind={kind} fields={formFields(cfg)} initial={cfg.defaults} allowedStatuses={perms.draftOnly ? ["draft"] : undefined} cancelHref={cfg.basePath} submitLabel={`Create ${cfg.singular}`} />
        </Card>
      ) : (
        <Notice>Your role cannot create this.</Notice>
      )}
    </>
  );
}

export async function ContentEditPage({ kind, id, extra }: { kind: ContentKind; id: string; extra?: React.ReactNode }) {
  const cfg = contentConfigs[kind];
  if (!UUID_RE.test(id)) notFound();
  const profile = await requireRole(staffRoles, `${cfg.basePath}/${id}`);
  const perms = contentPermissions(kind, profile.role);

  const supabase = await createClient();
  const { data } = await supabase.from(cfg.table).select(["id", ...cfg.fields.map((f) => f.name)].join(", ")).eq("id", id).maybeSingle();
  if (!data) notFound();
  const row = data as unknown as Row;
  const lockedForEditor = perms.draftOnly && cfg.statusField !== null && row[cfg.statusField] !== "draft";

  return (
    <>
      <BackLink href={cfg.basePath}>← {cfg.label}</BackLink>
      <div className="mt-4"><PageTitle eyebrow="Administration" title={String(row[cfg.titleField])} /></div>
      <div className="space-y-6">
        {!perms.write && <Notice tone="pending">Your role can view this {cfg.singular} but not change it.</Notice>}
        {lockedForEditor && <Notice tone="pending">This {cfg.singular} is no longer a draft, so only an officer can change it.</Notice>}
        {perms.write && !lockedForEditor && (
          <Card>
            <ContentForm kind={kind} id={id} fields={formFields(cfg)} initial={toInitial(cfg.fields, row)} allowedStatuses={perms.draftOnly ? ["draft"] : undefined} cancelHref={cfg.basePath} submitLabel="Save changes" />
          </Card>
        )}
        {kind === "announcements" && can.downloadPoster(profile.role) && (
          <PosterCard
            href={`${cfg.basePath}/${id}/poster`}
            signer={`${profile.full_name}, ${roleLabels[profile.role]}`}
            published={row.status === "published"}
            truncated={fitPosterText(String(row.title ?? ""), String(row.body ?? "")).truncated}
          />
        )}
        {extra}
        {perms.delete && (
          <Card className="space-y-3">
            <h2 className="text-xl text-brand-900">Delete</h2>
            <p className="text-sm text-muted">Deleting removes it permanently. To hide it without deleting, set the status to Archived instead.</p>
            <DeleteContentButton kind={kind} id={id} label={cfg.singular} />
          </Card>
        )}
      </div>
    </>
  );
}

function PosterCard({ href, signer, published, truncated }: { href: string; signer: string; published: boolean; truncated: boolean }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-xl text-brand-900">Official poster</h2>
      <p className="text-sm text-muted">
        Download this announcement as an A4 poster (PNG) with the MKUESA letterhead and logo, signed as <strong className="text-ink">{signer}</strong>.
      </p>
      {!published && <Notice tone="pending">This announcement is not published yet, so the poster is marked DRAFT.</Notice>}
      {truncated && <Notice tone="pending">The message is too long for one page, so the poster shows the first part and points readers to the member portal.</Notice>}
      <a href={href} download className={buttonClass("primary")}>Download poster</a>
    </Card>
  );
}

type RegRow = { id: string; status: string; registered_at: string; attended_at: string | null; profile: { full_name: string; email: string } | null };

/** Sign-ups for one event, with attendance marking. Visible to leadership only (the database hides it from everyone else). */
export async function EventRegistrations({ eventId, role }: { eventId: string; role: Parameters<typeof can.seeRegistrations>[0] }) {
  if (!can.seeRegistrations(role)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("id, status, registered_at, attended_at, profile:profiles(full_name, email)")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });
  const rows = (data ?? []) as unknown as RegRow[];
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <Card className="space-y-4">
      <h2 className="text-xl text-brand-900">Registrations</h2>
      <p className="text-sm text-muted">
        {count("registered")} registered · {count("attended")} attended · {count("waitlisted")} on the waiting list · {count("cancelled")} cancelled
      </p>
      {rows.length ? (
        <div className="scroll-x">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-brand-100 text-muted">
              <tr><th scope="col" className="py-2 pr-4 font-medium">Person</th><th scope="col" className="py-2 pr-4 font-medium">Status</th><th scope="col" className="py-2 pr-4 font-medium">Registered</th><th scope="col" className="py-2 font-medium"><span className="sr-only">Action</span></th></tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-4"><p className="font-medium">{r.profile?.full_name ?? "Unknown"}</p><p className="break-all text-muted">{r.profile?.email}</p></td>
                  <td className="py-3 pr-4 capitalize">{r.status}{r.attended_at ? ` · ${formatEventDate(r.attended_at)}` : ""}</td>
                  <td className="py-3 pr-4">{formatDay(r.registered_at)}</td>
                  <td className="py-3">{r.status === "registered" && <MarkAttendedButton id={r.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted">Nobody has registered yet.</p>
      )}
    </Card>
  );
}
