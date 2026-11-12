import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageStatusForm } from "@/components/admin/admin-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { can } from "@/lib/auth/permissions";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Messages (admin)", robots: { index: false, follow: false } };

type Row = { id: string; name: string; email: string; subject: string; message: string; status: string; created_at: string };

export default async function MessagesPage() {
  const me = await requireRole(staffRoles, "/admin/messages");
  if (!can.readMessages(me.role)) notFound();
  const canEdit = can.updateMessages(me.role);

  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("id, name, email, subject, message, status, created_at").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageTitle eyebrow="Administration" title="Contact messages" description="Messages sent through the website contact form. Reply by email, then mark the message as replied." />
      <div className="space-y-6">
        {!canEdit && <Notice tone="pending">Your role can read messages. The Secretary and Super Administrator update their status.</Notice>}
        {rows.length ? (
          <ul className="space-y-4">
            {rows.map((m) => (
              <li key={m.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl text-brand-900">{m.subject}</h2>
                      <p className="text-sm text-muted">{m.name} · <a href={`mailto:${encodeURIComponent(m.email)}`} className="break-all underline">{m.email}</a> · {formatEventDate(m.created_at)}</p>
                    </div>
                    <Badge tone={m.status === "new" ? "accent" : "neutral"} className="capitalize">{m.status}</Badge>
                  </div>
                  {/* Plain text on purpose: a visitor wrote this, so it is never rendered as HTML. */}
                  <p className="whitespace-pre-line break-words">{m.message}</p>
                  <MessageStatusForm id={m.id} current={m.status} canEdit={canEdit} />
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card><p className="text-muted">No messages yet.</p></Card>
        )}
      </div>
    </>
  );
}
