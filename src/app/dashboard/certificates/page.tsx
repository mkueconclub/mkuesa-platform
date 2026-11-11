import type { Metadata } from "next";
import { Award } from "lucide-react";
import { PageTitle } from "@/components/dashboard/page-title";
import { Card } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";
import type { CertificateRow } from "@/types/database";

export const metadata: Metadata = { title: "Certificates", robots: { index: false, follow: false } };

export default async function CertificatesPage() {
  const profile = await requireProfile("/dashboard/certificates");
  const supabase = await createClient();
  // Revoked certificates are hidden from their holder by Row Level Security.
  const { data } = await supabase
    .from("certificates")
    .select("id, title, certificate_type, issued_at, verification_code, event:events(title)")
    .eq("profile_id", profile.id)
    .order("issued_at", { ascending: false });
  const items = (data ?? []) as unknown as CertificateRow[];

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="Certificates" description="Certificates issued to you by the association." />
      {items.length ? (
        <ul className="grid gap-6 md:grid-cols-2">
          {items.map((c) => (
            <li key={c.id}>
              <Card className="h-full">
                <Award aria-hidden className="size-8 text-accent-600" />
                <h2 className="mt-3 text-xl text-brand-900">{c.title}</h2>
                <p className="text-sm capitalize text-muted">{c.certificate_type}{c.event ? ` · ${c.event.title}` : ""}</p>
                <p className="mt-3 text-sm text-muted">Issued {formatEventDate(c.issued_at)}</p>
                <p className="mt-1 text-sm text-muted">Verification code</p>
                <p className="break-all font-mono text-sm">{c.verification_code}</p>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card><p className="text-muted">You have no certificates yet. Certificates are issued by the association for events and activities you take part in.</p></Card>
      )}
      <p className="mt-6 max-w-2xl text-sm text-muted">Downloadable certificate files and public verification pages are planned for a later phase.</p>
    </>
  );
}
