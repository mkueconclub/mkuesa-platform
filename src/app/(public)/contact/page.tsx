import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" description="Questions about membership, events or partnerships? We would like to hear from you." />
      <Section tone="paper">
        <div className="grid gap-10 lg:grid-cols-2">
          <Notice tone="pending" title="Official contact details: to be supplied">
            The association&rsquo;s email address, phone number, office location and social media links will be added once provided.
          </Notice>
          <Card>
            <h2 className="text-2xl text-brand-900">Send a message</h2>
            <div className="mt-5">
              <ContactForm />
            </div>
            <p className="mt-5 text-sm text-muted">Your details are used only to reply. See the <Link href="/privacy" className="font-medium text-brand-700 underline">privacy notice</Link>.</p>
          </Card>
        </div>
      </Section>
    </>
  );
}
