import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { sampleEvents } from "@/config/sample-content";
import { formatEventDate } from "@/lib/utils/date";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sampleEvents.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = sampleEvents.find((e) => e.slug === slug);
  return { title: event ? event.title : "Event" };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = sampleEvents.find((e) => e.slug === slug);
  if (!event) notFound();

  return (
    <>
      <PageHeader eyebrow={event.status === "upcoming" ? "Upcoming event" : "Past event"} title={event.title} description={event.summary} />
      <Section tone="paper">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <Badge tone="neutral">Sample content</Badge>
            <p className="mt-4 text-lg">{event.description}</p>
          </div>
          <Card className="space-y-4 self-start">
            <p className="flex items-start gap-2"><CalendarDays aria-hidden className="mt-1 size-5 shrink-0 text-brand-600" /> {formatEventDate(event.startsAt)}</p>
            <p className="flex items-start gap-2"><MapPin aria-hidden className="mt-1 size-5 shrink-0 text-brand-600" /> {event.location}</p>
            {event.status === "upcoming" ? (
              <>
                <Button disabled className="w-full">Registration opens soon</Button>
                <Notice tone="pending">Event registration is available to signed-in members once the member portal launches.</Notice>
              </>
            ) : (
              <p className="text-sm text-muted">This event has taken place.</p>
            )}
          </Card>
        </div>
        <div className="mt-10">
          <Button href="/events" variant="outline">Back to events</Button>
        </div>
      </Section>
    </>
  );
}
