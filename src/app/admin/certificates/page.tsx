import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssueCertificateForm, RevokeCertificateForm } from "@/components/admin/admin-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { can } from "@/lib/auth/permissions";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Certificates (admin)", robots: { index: false, follow: false } };

type Row = {
  id: string;
  title: string;
  certificate_type: string;
  issued_at: string;
  verification_code: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  holder: { full_name: string; email: string } | null;
  event: { title: string } | null;
};

export default async function CertificatesAdminPage() {
  const me = await requireRole(staffRoles, "/admin/certificates");
  if (!can.readCertificates(me.role)) notFound();
  const canIssue = can.issueCertificates(me.role);
  const canRevoke = can.revokeCertificates(me.role);

  const supabase = await createClient();
  const [certs, events] = await Promise.all([
    // certificates link to profiles twice (holder and issuer), so the holder is named explicitly.
    supabase
      .from("certificates")
      .select("id, title, certificate_type, issued_at, verification_code, revoked_at, revoked_reason, holder:profiles!profile_id(full_name, email), event:events(title)")
      .order("issued_at", { ascending: false })
      .limit(100),
    canIssue ? supabase.from("events").select("id, title").order("starts_at", { ascending: false }).limit(50) : null,
  ]);
  const rows = (certs.data ?? []) as unknown as Row[];

  return (
    <>
      <PageTitle eyebrow="Administration" title="Certificates" description="Issue certificates to members and revoke them if needed. Holders see their certificates in the member portal." />
      <div className="space-y-8">
        {!canIssue && <Notice tone="pending">Your role can view certificates but not issue them.</Notice>}
        {canIssue && (
          <Card>
            <h2 className="mb-4 text-2xl text-brand-900">Issue a certificate</h2>
            <IssueCertificateForm events={(events?.data ?? []) as { id: string; title: string }[]} />
          </Card>
        )}

        <section aria-labelledby="issued-heading">
          <h2 id="issued-heading" className="mb-4 text-2xl text-brand-900">Issued certificates</h2>
          {rows.length ? (
            <ul className="space-y-4">
              {rows.map((c) => (
                <li key={c.id}>
                  <Card className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl text-brand-900">{c.title}</h3>
                        <p className="text-sm text-muted">{c.holder?.full_name ?? "Unknown"} · <span className="break-all">{c.holder?.email}</span></p>
                        <p className="text-sm capitalize text-muted">{c.certificate_type}{c.event ? ` · ${c.event.title}` : ""} · issued {formatDay(c.issued_at)}</p>
                        <p className="break-all font-mono text-xs text-muted">{c.verification_code}</p>
                      </div>
                      {c.revoked_at ? <Badge tone="neutral">Revoked {formatDay(c.revoked_at)}</Badge> : <Badge tone="brand">In force</Badge>}
                    </div>
                    {c.revoked_at && c.revoked_reason && <p className="text-sm text-muted">Reason: {c.revoked_reason}</p>}
                    {!c.revoked_at && canRevoke && <RevokeCertificateForm id={c.id} />}
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card><p className="text-muted">No certificates have been issued yet.</p></Card>
          )}
        </section>
      </div>
    </>
  );
}
