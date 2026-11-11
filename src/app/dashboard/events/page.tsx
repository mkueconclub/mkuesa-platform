import type { Metadata } from "next";
import { Clock, MapPin, Users } from "lucide-react";
import { CancelRegistrationButton, RegisterEventButton } from "@/components/dashboard/member-forms";
import { PageTitle } from "@/components/dashboard/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/session";
import { eventHasEnded, registrationOpen } from "@/lib/member/queries";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/date";
import type { EventRow, RegistrationRow } from "@/types/database";

export const metadata: Metadata = { title: "Events", robots: { index: false, follow: false } };

const EVENT_COLUMNS = "id, title, slug, description, location, starts_at, ends_at, capacity, registration_required, registration_deadline, visibility";

function EventCard({ event, reg, now }: { event: EventRow; reg: RegistrationRow | undefined; now: Date }) {
  const active = reg && reg.status !== "cancelled" ? reg : undefined;
  const ended = eventHasEnded(event, now);
  const open = registrationOpen(event, now);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        {event.visibility === "members" && <Badge tone="brand">Members only</Badge>}
        {active && <Badge tone={active.status === "waitlisted" ? "accent" : "brand"}>{active.status === "waitlisted" ? "On waiting list" : active.status}</Badge>}
      </div>
      <h2 className="mt-2 text-2xl text-brand-900">{event.title}</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        <li className="flex items-center gap-1.5"><Clock aria-hidden className="size-4" />{formatEventDate(event.starts_at)}</li>
        {event.location && <li className="flex items-center gap-1.5"><MapPin aria-hidden className="size-4" />{event.location}</li>}
        {event.capacity && <li className="flex items-center gap-1.5"><Users aria-hidden className="size-4" />{event.capacity} places</li>}
      </ul>
      {/* Plain text on purpose: never rendered as HTML. */}
      <p className="mt-4 line-clamp-4 whitespace-pre-line">{event.description}</p>

      {!ended && (
        <div className="mt-5">
          {active ? (
            <CancelRegistrationButton eventId={event.id} />
          ) : open ? (
            <RegisterEventButton eventId={event.id} label={reg ? "Register again" : "Register"} />
          ) : event.registration_required ? (
            <p className="text-sm text-muted">Registration is closed for this event.</p>
          ) : (
            <p className="text-sm text-muted">No registration needed. Just turn up.</p>
          )}
          {open && event.registration_deadline && !active && (
            <p className="mt-2 text-sm text-muted">Register by {formatEventDate(event.registration_deadline)}.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export default async function EventsPage() {
  const profile = await requireProfile("/dashboard/events");
  const supabase = await createClient();
  const [eventsRes, regsRes] = await Promise.all([
    supabase.from("events").select(EVENT_COLUMNS).eq("status", "published").order("starts_at", { ascending: true }).limit(200),
    supabase.from("event_registrations").select("id, event_id, status, registered_at, attended_at").eq("profile_id", profile.id),
  ]);
  const events = (eventsRes.data ?? []) as EventRow[];
  const regs = new Map(((regsRes.data ?? []) as RegistrationRow[]).map((r) => [r.event_id, r]));

  const now = new Date();
  const upcoming = events.filter((e) => !eventHasEnded(e, now));
  const past = events
    .filter((e) => eventHasEnded(e, now) && regs.get(e.id) && regs.get(e.id)!.status !== "cancelled")
    .reverse();

  return (
    <>
      <PageTitle eyebrow="Member dashboard" title="Events" description="Upcoming association events and your participation record." />
      <div className="space-y-10">
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="mb-4 text-xl text-brand-900">Upcoming</h2>
          {upcoming.length ? (
            <ul className="space-y-6">
              {upcoming.map((e) => (
                <li key={e.id}><EventCard event={e} reg={regs.get(e.id)} now={now} /></li>
              ))}
            </ul>
          ) : (
            <Card><p className="text-muted">No upcoming events have been published yet. Check back soon.</p></Card>
          )}
        </section>

        <section aria-labelledby="past-heading">
          <h2 id="past-heading" className="mb-4 text-xl text-brand-900">Your past events</h2>
          {past.length ? (
            <Card>
              <ul className="divide-y divide-brand-100">
                {past.map((e) => {
                  const r = regs.get(e.id)!;
                  return (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-sm text-muted">{formatEventDate(e.starts_at)}</p>
                      </div>
                      <Badge tone={r.status === "attended" ? "brand" : "neutral"}>{r.status === "attended" ? "Attended" : r.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : (
            <Card><p className="text-muted">Events you register for or attend will appear here.</p></Card>
          )}
        </section>
      </div>
    </>
  );
}
