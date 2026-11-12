import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/admin/content-form";
import { PrintButton } from "@/components/dashboard/print-button";
import { siteConfig } from "@/config/site";
import { formatVerificationCode } from "@/lib/certificates";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = { id: string; title: string; certificate_type: string; issued_at: string; verification_code: string; event: { title: string } | null };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const profile = await requireProfile(`/dashboard/certificates/${id}`);
  const supabase = await createClient();
  // Row Level Security: only your own, and never a revoked one.
  const { data } = await supabase
    .from("certificates")
    .select("id, title, certificate_type, issued_at, verification_code, event:events(title)")
    .eq("id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!data) notFound();
  const c = data as unknown as Row;
  const verifyUrl = `${siteConfig.url.replace(/\/$/, "")}/verify/${c.verification_code}`;

  return (
    <>
      <BackLink href="/dashboard/certificates">← Certificates</BackLink>
      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-brand-900">Your certificate</h1>
        <PrintButton />
      </div>

      <div id="certificate" className="rounded-lg border-4 border-double border-brand-700 bg-paper p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent-700">{siteConfig.name}</p>
        <p className="mt-1 text-sm text-muted">{siteConfig.fullName}</p>
        <p className="mt-8 font-display text-4xl capitalize text-brand-900 sm:text-5xl">Certificate of {c.certificate_type}</p>
        <p className="mt-8 text-sm uppercase tracking-widest text-muted">Awarded to</p>
        <p className="mt-2 font-display text-3xl text-ink sm:text-4xl">{profile.full_name}</p>
        <p className="mx-auto mt-6 max-w-xl text-lg">{c.title}</p>
        {c.event && <p className="mt-1 text-muted">{c.event.title}</p>}
        <p className="mt-6 text-muted">Issued on {formatDay(c.issued_at)}</p>

        <div className="mx-auto mt-10 max-w-xl border-t border-brand-100 pt-5 text-xs text-muted">
          <p>To confirm this certificate is genuine, visit</p>
          <p className="break-all font-mono text-ink">{verifyUrl}</p>
          <p className="mt-2">Verification code: <span className="break-all font-mono text-ink">{formatVerificationCode(c.verification_code)}</span></p>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-muted">In the print window choose &ldquo;Save as PDF&rdquo; as the printer to keep a copy. Anyone can check this certificate online using the code above; they will see your first name and the initial of your last name only.</p>
    </>
  );
}
