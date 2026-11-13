import { ExecutiveApprovalForm } from "@/components/executives/executive-forms";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { can } from "@/lib/auth/permissions";
import { roleLabels, isUserRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type Entry = { id: string; profile_id: string | null; public_consent: boolean; contact_email: string | null; position_title: string };
type Account = { id: string; full_name: string; email: string; role: string };

/** Shown on a committee entry. Only the Super Administrator sees it (the database refuses anyone else). */
export async function ExecutiveApprovalCard({ id, role }: { id: string; role: UserRole }) {
  if (!can.approveExecutives(role)) {
    return (
      <Notice tone="pending" title="Approval">
        Only the Super Administrator can approve an officer. An approved officer appears on the About page and adds their own contact email.
      </Notice>
    );
  }
  const supabase = await createClient();
  const [{ data: entryData }, { data: accountData }] = await Promise.all([
    supabase.from("executive_positions").select("id, profile_id, public_consent, contact_email, position_title").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("id, full_name, email, role").neq("role", "member").order("full_name", { ascending: true }).limit(200),
  ]);
  const entry = entryData as Entry | null;
  if (!entry) return null;
  const accounts = ((accountData ?? []) as Account[]).map((a) => ({
    value: a.id,
    label: `${a.full_name} (${a.email}) · ${isUserRole(a.role) ? roleLabels[a.role] : a.role}`,
  }));

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl text-brand-900">Approval</h2>
        <Badge tone={entry.public_consent ? "brand" : "neutral"}>{entry.public_consent ? "Approved" : "Not approved"}</Badge>
        {entry.public_consent && <Badge tone={entry.contact_email ? "brand" : "accent"}>{entry.contact_email ? "Email added" : "Waiting for the officer's email"}</Badge>}
      </div>
      <p className="text-sm text-muted">
        Choose the officer&rsquo;s account and approve. The officer then appears on the About page, signs in, and adds their own contact email. Visitors can write to them once the email is added.
      </p>
      <ExecutiveApprovalForm id={entry.id} approved={entry.public_consent} accounts={accounts} currentProfileId={entry.profile_id ?? ""} />
    </Card>
  );
}
