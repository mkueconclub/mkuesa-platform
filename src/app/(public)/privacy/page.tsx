import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { Section } from "@/components/ui/section";
import { contact, privacyNoticeVersion } from "@/config/association";

export const metadata: Metadata = { title: "Privacy notice" };

const collected = [
  "Account details: full name and email address (required).",
  "Optional profile details: programme, year of study, phone number and registration number.",
  "Membership applications: academic year, an optional motivation statement, and the decision made on the application.",
  "Event registrations and attendance, and certificates issued to you.",
  "Messages you send through the contact form: name, email address, subject and message.",
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy notice" description="How MKUESA handles personal information on this platform." />
      <Section tone="paper">
        <div className="max-w-3xl space-y-8">
          <div>
            <h2 className="text-2xl text-brand-900">What we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {collected.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl text-brand-900">Why we collect it</h2>
            <p className="mt-3">To run the association: managing membership, organising events, issuing certificates, and replying to messages. We only ask for what these purposes need, and we do not sell personal information.</p>
          </div>
          <div>
            <h2 className="text-2xl text-brand-900">Who can see it</h2>
            <p className="mt-3">You can see your own information. Members of the executive committee can see information they need for their role: for example, membership staff can see applications, and the Treasurer and Content Editor cannot see members&rsquo; personal details. Access is enforced by the database itself, and important administrative actions are recorded in an audit log.</p>
          </div>
          <div>
            <h2 className="text-2xl text-brand-900">Where it is stored</h2>
            <p className="mt-3">The platform uses Supabase (database and sign-in) and Vercel (hosting). These providers may store data outside Kenya.</p>
          </div>
          <div>
            <h2 className="text-2xl text-brand-900">Your rights</h2>
            <p className="mt-3">Under the Data Protection Act, 2019, you may ask to access, correct or delete your personal information, and to object to its processing. You can edit your profile after signing in.</p>
          </div>
          <div>
            <h2 className="text-2xl text-brand-900">Contact for data requests</h2>
            <p className="mt-3">
              To make a request or ask a question about how your information is handled, write to the association at{" "}
              <a href={`mailto:${contact.email}`} className="font-semibold text-brand-700 underline">{contact.email}</a>.
            </p>
          </div>
          <p className="text-sm text-muted">Privacy notice version {privacyNoticeVersion}.</p>
        </div>
      </Section>
    </>
  );
}
