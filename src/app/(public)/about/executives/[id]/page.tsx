import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { ExecutiveMessageForm } from "@/components/executives/executive-forms";
import { PageHeader } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/config/site";
import { canBeContacted, initials } from "@/lib/executives/profile";
import { getPublicExecutive } from "@/lib/executives/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getPublicExecutive((await params).id);
  return e ? { title: `${e.display_name}, ${e.position_title}`, description: `${e.display_name}, ${e.position_title} of ${siteConfig.name}. Send a message.` } : { title: "Officer" };
}

export default async function ExecutiveProfilePage({ params }: Props) {
  const e = await getPublicExecutive((await params).id);
  if (!e) notFound();
  const reachable = canBeContacted(e);

  return (
    <>
      <PageHeader eyebrow={e.position_title} title={e.display_name} description={e.term_label ? `Executive committee, ${e.term_label}` : "Executive committee"} />
      <Section tone="paper">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <Card className="space-y-5 self-start">
            <div className="flex items-center gap-4">
              <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-700 font-display text-2xl text-white">{initials(e.display_name)}</span>
              <div>
                <p className="font-display text-2xl text-brand-900">{e.display_name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-700">{e.position_title}</p>
              </div>
            </div>
            {/* Plain text on purpose: the officer typed this, so it is never rendered as HTML. */}
            {e.bio && <p className="whitespace-pre-line break-words">{e.bio}</p>}
            {e.contact_email && (
              <p className="flex items-center gap-3">
                <Mail aria-hidden className="size-5 shrink-0 text-brand-600" />
                <a href={`mailto:${encodeURIComponent(e.contact_email)}`} className="break-all font-semibold text-brand-700 underline">{e.contact_email}</a>
              </p>
            )}
          </Card>
          <Card>
            <h2 className="text-2xl text-brand-900">Send a message to {e.display_name}</h2>
            {reachable ? (
              <>
                <p className="mt-2 text-muted">Your message goes straight to {e.display_name}, and to nobody else on the committee.</p>
                <div className="mt-5">
                  <ExecutiveMessageForm executiveId={e.id} officerName={e.display_name} />
                </div>
              </>
            ) : (
              <div className="mt-4"><Notice tone="pending">This officer has not added contact details yet. Please check back soon.</Notice></div>
            )}
          </Card>
        </div>
      </Section>
    </>
  );
}
