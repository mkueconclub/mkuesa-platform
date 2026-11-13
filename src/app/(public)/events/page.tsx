import type { Metadata } from "next";
import { EventCard } from "@/components/public/event-card";
import { PageHeader } from "@/components/public/page-header";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { getEvents, type PublicEvent } from "@/lib/public/content";
import { excerpt, partitionEvents } from "@/lib/public/filters";

export const metadata: Metadata = { title: "Events", description: "Talks, workshops, competitions and gatherings organised by the association." };
export const dynamic = "force-dynamic"; // always shows the current published events

const card = (e: PublicEvent) => ({ slug: e.slug, title: e.title, summary: excerpt(e.description, 140), startsAt: e.starts_at, location: e.location });

export default async function EventsPage() {
  const { ok, items } = await getEvents();
  const { upcoming, past } = partitionEvents(items);
  return (
    <>
      <PageHeader eyebrow="Events" title="Events" description="Talks, workshops, competitions and gatherings for economics students." />
      <Section tone="paper" eyebrow="Coming up" title="Upcoming events">
        {!ok ? (
          <Notice tone="pending" title="Events are temporarily unavailable">Please try again shortly.</Notice>
        ) : upcoming.length ? (
          <ul className="grid gap-6 md:grid-cols-2">
            {upcoming.map((e) => (
              <li key={e.id}><EventCard event={card(e)} /></li>
            ))}
          </ul>
        ) : (
          <p className="max-w-2xl text-lg text-muted">There are no upcoming events at the moment. New events are announced here and to members through the member portal.</p>
        )}
      </Section>
      {past.length > 0 && (
        <Section eyebrow="Archive" title="Past events">
          <ul className="grid gap-6 md:grid-cols-2">
            {past.map((e) => (
              <li key={e.id}><EventCard event={card(e)} /></li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
