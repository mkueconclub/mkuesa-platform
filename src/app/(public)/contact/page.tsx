import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" description="Questions about membership, events or partnerships? We would like to hear from you." />
      <Section tone="paper">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <Notice tone="pending" title="Official contact details: to be supplied">
              The association&rsquo;s email address, phone number, office location and social media links will be added once provided.
            </Notice>
          </div>
          <Card>
            <h2 className="text-2xl text-brand-900">Send a message</h2>
            <form className="mt-5" aria-describedby="form-status">
              <fieldset disabled className="space-y-5">
                <legend className="sr-only">Contact form</legend>
                <Input label="Full name" name="name" autoComplete="name" />
                <Input label="Email" name="email" type="email" autoComplete="email" />
                <Input label="Subject" name="subject" />
                <Textarea label="Message" name="message" />
                <Button type="submit">Send message</Button>
              </fieldset>
            </form>
            <Notice id="form-status" className="mt-5">The contact form goes live with spam protection when the backend is connected (Phase 3).</Notice>
          </Card>
        </div>
      </Section>
    </>
  );
}
