import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dateParts, formatEventDate } from "@/lib/utils/date";

export type EventCardData = { slug: string; title: string; summary: string; startsAt: string; location: string | null };

export function EventCard({ event }: { event: EventCardData }) {
  const { day, month } = dateParts(event.startsAt);
  return (
    <Card interactive className="group relative flex h-full gap-5">
      <div
        aria-hidden
        className="flex size-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border-t-4 border-t-accent-500 bg-brand-800 text-white"
      >
        <span className="font-display text-3xl leading-none">{day}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-wider">{month}</span>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl text-brand-900">
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="text-muted">{event.summary}</p>
        <ul className="mt-auto space-y-1 pt-1 text-sm text-muted">
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden className="size-4" /> {formatEventDate(event.startsAt)}
          </li>
          {event.location && (
            <li className="flex items-center gap-1.5">
              <MapPin aria-hidden className="size-4" /> {event.location}
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
}
