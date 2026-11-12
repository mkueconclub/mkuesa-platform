import type { Metadata } from "next";
import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Notice } from "@/components/ui/notice";
import { formatVerificationCode, normalizeVerificationCode, type VerifiedCertificate } from "@/lib/certificates";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDay } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Certificate check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic"; // always check the live record, never a cached copy

export default async function VerifyResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = normalizeVerificationCode(code);

  let cert: VerifiedCertificate | null = null;
  let unavailable = false;
  if (clean) {
    if (!isSupabaseConfigured()) {
      unavailable = true;
    } else {
      const { data, error } = await createPublicClient().rpc("verify_certificate", { p_code: clean });
      if (error) {
        console.error("verify_certificate failed:", error.code, error.message);
        unavailable = true;
      } else {
        cert = ((data ?? []) as VerifiedCertificate[])[0] ?? null;
      }
    }
  }

  return (
    <>
      <PageHeader eyebrow="Certificates" title="Certificate check" />
      <section className="bg-ivory py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl space-y-6">
            {unavailable ? (
              <Notice tone="pending" title="Verification is not available right now">Please try again later.</Notice>
            ) : cert ? (
              <Card className="space-y-5">
                {cert.status === "valid" ? (
                  <div className="flex items-start gap-3 text-brand-800" role="status">
                    <CircleCheck aria-hidden className="mt-1 size-8 shrink-0" />
                    <div><h2 className="text-2xl">This certificate is genuine</h2><p className="text-muted">It was issued by MKUESA and is still valid.</p></div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-red-800" role="status">
                    <CircleAlert aria-hidden className="mt-1 size-8 shrink-0" />
                    <div><h2 className="text-2xl">This certificate has been revoked</h2><p className="text-muted">It was issued by MKUESA but is no longer valid. Contact the association if you need to know more.</p></div>
                  </div>
                )}
                <dl className="grid gap-4 border-t border-brand-100 pt-5 sm:grid-cols-2">
                  <div><dt className="text-sm text-muted">Awarded to</dt><dd className="font-medium">{cert.holder}</dd></div>
                  <div><dt className="text-sm text-muted">Certificate</dt><dd className="font-medium">{cert.title}</dd></div>
                  <div><dt className="text-sm text-muted">Type</dt><dd className="font-medium capitalize">{cert.certificate_type}</dd></div>
                  <div><dt className="text-sm text-muted">Issued</dt><dd className="font-medium">{formatDay(cert.issued_at)}</dd></div>
                  {cert.event_title && <div className="sm:col-span-2"><dt className="text-sm text-muted">Event</dt><dd className="font-medium">{cert.event_title}</dd></div>}
                  <div className="sm:col-span-2"><dt className="text-sm text-muted">Verification code</dt><dd className="break-all font-mono text-sm">{formatVerificationCode(clean!)}</dd></div>
                </dl>
                <p className="text-sm text-muted">The holder&rsquo;s name is shortened to protect their privacy. Compare it with the name on the certificate you were shown.</p>
              </Card>
            ) : (
              <Card className="space-y-3">
                <div className="flex items-start gap-3 text-red-800" role="status">
                  <CircleX aria-hidden className="mt-1 size-8 shrink-0" />
                  <div><h2 className="text-2xl">No certificate found</h2><p className="text-muted">We could not find a certificate with this code. Check that it was copied exactly, or ask the person to share it again.</p></div>
                </div>
              </Card>
            )}
            <Button href="/verify" variant="outline">Check another certificate</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
