import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SampleEvent } from "@/config/sample-content";
import { dateParts } from "@/lib/utils/date";

export function EventCard({ event }: { event: SampleEvent }) {
  const { day, month } = dateParts(event.startsAt);
  return (
    <Card className="relative flex h-full gap-5 transition-shadow hover:shadow-md">
      <div aria-hidden className="flex size-16 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-800 text-white">
        <span className="font-display text-2xl leading-none">{day}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-wider">{month}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Badge tone="neutral" className="self-start">Sample content</Badge>
        <h3 className="text-xl text-brand-900">
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="text-muted">{event.summary}</p>
        <p className="mt-auto flex items-center gap-1.5 text-sm text-muted">
          <MapPin aria-hidden className="size-4" /> {event.location}
        </p>
      </div>
    </Card>
  );
}
