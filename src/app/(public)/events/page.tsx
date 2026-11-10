import type { Metadata } from "next";
import { EventCard } from "@/components/public/event-card";
import { PageHeader } from "@/components/public/page-header";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { sampleEvents } from "@/config/sample-content";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const upcoming = sampleEvents.filter((e) => e.status === "upcoming");
  const past = sampleEvents.filter((e) => e.status === "past");
  return (
    <>
      <PageHeader eyebrow="Events" title="Events" description="Talks, workshops, competitions and gatherings for economics students." />
      <Section tone="paper" eyebrow="Coming up" title="Upcoming events">
        <Notice className="mb-8">Sample events shown to demonstrate the layout. Official events will replace them.</Notice>
        <ul className="grid gap-6 md:grid-cols-2">
          {upcoming.map((e) => (
            <li key={e.slug}><EventCard event={e} /></li>
          ))}
        </ul>
      </Section>
      <Section eyebrow="Archive" title="Past events">
        <ul className="grid gap-6 md:grid-cols-2">
          {past.map((e) => (
            <li key={e.slug}><EventCard event={e} /></li>
          ))}
        </ul>
      </Section>
    </>
  );
}
