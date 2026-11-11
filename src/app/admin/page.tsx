import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { memberReaderRoles, roleLabels } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const profile = await requireProfile("/admin");
  const canSeeApplications = memberReaderRoles.includes(profile.role);
  let pending: number | null = null;
  if (canSeeApplications) {
    const supabase = await createClient();
    const { count } = await supabase.from("memberships").select("id", { count: "exact", head: true }).eq("status", "pending");
    pending = count ?? 0;
  }

  return (
    <Section eyebrow="Administration" title="Admin dashboard">
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-muted">Signed in as</p>
          <p className="font-display text-2xl text-brand-900">{profile.full_name} · {roleLabels[profile.role]}</p>
        </Card>
        {pending !== null && (
          <Card>
            <p className="text-sm text-muted">Pending membership applications</p>
            <p className="font-display text-4xl text-brand-900">{pending}</p>
          </Card>
        )}
        <Notice tone="pending">Member management, approvals, content publishing, certificates and audit logs are built in Phase 5.</Notice>
      </div>
    </Section>
  );
}
