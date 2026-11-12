import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { normalizeVerificationCode } from "@/lib/certificates";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check that an MKUESA certificate is genuine.",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  let error: string | undefined;
  if (code !== undefined) {
    const clean = normalizeVerificationCode(code.replace(/\s+/g, ""));
    if (clean) redirect(`/verify/${clean}`);
    error = "A certificate code has 32 letters and numbers (0-9 and a-f). Check it and try again.";
  }
  return (
    <>
      <PageHeader eyebrow="Certificates" title="Verify a certificate" description="Every certificate issued by MKUESA carries a verification code. Enter it here to confirm the certificate is genuine." />
      <section className="bg-ivory py-16 sm:py-24">
        <Container>
          <Card className="max-w-2xl">
            {/* A plain GET form: works without JavaScript. */}
            <form method="get" action="/verify" className="space-y-5">
              <Input label="Verification code" name="code" required autoComplete="off" spellCheck={false} defaultValue={code} hint="Found on the certificate. Spaces are ignored." error={error} />
              <Button type="submit">Verify</Button>
            </form>
          </Card>
        </Container>
      </section>
    </>
  );
}
