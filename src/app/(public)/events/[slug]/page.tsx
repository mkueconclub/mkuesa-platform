import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { getEventBySlug } from "@/lib/public/content";
import { excerpt, hasEnded } from "@/lib/public/filters";
import { formatEventDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  return event ? { title: event.title, description: excerpt(event.description, 160) } : { title: "Event" };
}

export default async function EventPage({ params }: Props) {
  const event = await getEventBySlug((await params).slug);
  if (!event) notFound();
  const over = hasEnded(event);

  return (
    <>
      <PageHeader eyebrow={over ? "Past event" : "Upcoming event"} title={event.title} />
      <Section tone="paper">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Plain text on purpose: written by staff in a form, so never rendered as HTML. */}
          <p className="whitespace-pre-line break-words text-lg">{event.description}</p>
          <Card className="space-y-4 self-start">
            <p className="flex items-start gap-2"><CalendarDays aria-hidden className="mt-1 size-5 shrink-0 text-brand-600" /> {formatEventDate(event.starts_at)}</p>
            {event.location && <p className="flex items-start gap-2"><MapPin aria-hidden className="mt-1 size-5 shrink-0 text-brand-600" /> {event.location}</p>}
            {event.capacity && !over && <p className="flex items-start gap-2"><Users aria-hidden className="mt-1 size-5 shrink-0 text-brand-600" /> {event.capacity} places</p>}
            {over ? (
              <p className="text-sm text-muted">This event has taken place.</p>
            ) : event.registration_required ? (
              <>
                <Button href="/dashboard/events" className="w-full">Register in the member portal</Button>
                <p className="text-sm text-muted">Registration is for signed-in members. You will be asked to sign in first.</p>
              </>
            ) : (
              <p className="text-sm text-muted">No registration is required for this event.</p>
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
