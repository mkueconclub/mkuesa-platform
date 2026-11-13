import type { Metadata } from "next";
import { DeleteExecutiveMessageButton, ExecutiveMessageStatusForm } from "@/components/executives/executive-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { can } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { staffRoles } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";

export const metadata: Metadata = { title: "My inbox (admin)", robots: { index: false, follow: false } };

type Row = { id: string; sender_name: string; sender_email: string; subject: string; message: string; status: string; created_at: string };

export default async function ExecutiveInboxPage() {
  const me = await requireRole(staffRoles, "/admin/executive-inbox");
  const allowed = can.useExecutiveProfile(me.role);

  let rows: Row[] = [];
  if (allowed) {
    // The database only returns messages sent to this officer's own entry.
    const supabase = await createClient();
    const { data } = await supabase
      .from("executive_messages")
      .select("id, sender_name, sender_email, subject, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <PageTitle eyebrow="Administration" title="My inbox" description="Messages visitors sent to you from your profile on the About page. Only you can read them. Reply by email, then mark the message as replied." />
      <div className="space-y-6">
        {!allowed && <Notice tone="pending">The inbox is for members of the executive committee.</Notice>}
        {allowed && rows.length === 0 && <Card><p className="text-muted">No messages yet.</p></Card>}
        {rows.length > 0 && (
          <ul className="space-y-4">
            {rows.map((m) => (
              <li key={m.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl text-brand-900">{m.subject}</h2>
                      <p className="text-sm text-muted">{m.sender_name} · <a href={`mailto:${encodeURIComponent(m.sender_email)}`} className="break-all underline">{m.sender_email}</a> · {formatEventDate(m.created_at)}</p>
                    </div>
                    <Badge tone={m.status === "new" ? "accent" : "neutral"} className="capitalize">{m.status}</Badge>
                  </div>
                  {/* Plain text on purpose: a visitor wrote this, so it is never rendered as HTML. */}
                  <p className="whitespace-pre-line break-words">{m.message}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ExecutiveMessageStatusForm id={m.id} current={m.status} />
                    <DeleteExecutiveMessageButton id={m.id} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
