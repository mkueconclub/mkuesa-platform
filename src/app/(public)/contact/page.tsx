import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { contact } from "@/config/association";

export const metadata: Metadata = { title: "Contact", description: "Contact the Mount Kenya University Economics Students Association." };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" description="Questions about membership, events or partnerships? We would like to hear from you." />
      <Section tone="paper">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl text-brand-900">Official contact</h2>
            <p className="text-lg">
              For enquiries about membership, events, partnerships and opportunities, write to the executive committee at:
            </p>
            <p className="flex items-center gap-3 text-xl">
              <Mail aria-hidden className="size-6 shrink-0 text-brand-600" />
              <a href={`mailto:${contact.email}`} className="break-all font-semibold text-brand-700 underline">{contact.email}</a>
            </p>
            <p className="text-muted">You can also use the form to send a message directly through this website.</p>
          </div>
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
