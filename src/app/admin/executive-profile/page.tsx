import type { Metadata } from "next";
import Link from "next/link";
import { ExecutiveContactForm } from "@/components/executives/executive-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { can } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { staffRoles } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My officer profile (admin)", robots: { index: false, follow: false } };

type Entry = { id: string; display_name: string; position_title: string; term_label: string | null; bio: string | null; contact_email: string | null; public_consent: boolean };

export default async function ExecutiveProfilePage() {
  const me = await requireRole(staffRoles, "/admin/executive-profile");
  const allowed = can.useExecutiveProfile(me.role);

  let entry: Entry | null = null;
  if (allowed) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("executive_positions")
      .select("id, display_name, position_title, term_label, bio, contact_email, public_consent")
      .eq("profile_id", me.id)
      .eq("is_current", true)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    entry = (data as Entry | null) ?? null;
  }

  return (
    <>
      <PageTitle eyebrow="Administration" title="My officer profile" description="The profile visitors see when they open your name on the About page." />
      <div className="space-y-6">
        {!allowed && <Notice tone="pending">Officer profiles are for members of the executive committee.</Notice>}
        {allowed && !entry && (
          <Notice tone="pending" title="Not linked yet">
            Your account is not linked to a committee entry. The Super Administrator links and approves your entry first; then you can add your contact email here.
          </Notice>
        )}
        {entry && !entry.public_consent && (
          <Notice tone="pending" title="Waiting for approval">
            Your entry as {entry.position_title} is linked to your account but has not been approved by the Super Administrator yet. You will be able to add your contact email as soon as it is.
          </Notice>
        )}
        {entry?.public_consent && (
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl text-brand-900">{entry.display_name}, {entry.position_title}</h2>
              <Badge tone={entry.contact_email ? "brand" : "accent"}>{entry.contact_email ? "Live on the About page" : "Email needed"}</Badge>
            </div>
            {!entry.contact_email && <Notice tone="pending">Add your contact email to finish. Until you do, visitors can see your name but cannot open your profile or write to you.</Notice>}
            <ExecutiveContactForm email={entry.contact_email ?? ""} bio={entry.bio ?? ""} />
            <p className="text-sm text-muted">
              Your name, position, bio and email are public. Messages from visitors arrive in <Link href="/admin/executive-inbox" className="font-medium text-brand-700 underline">My inbox</Link>.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
