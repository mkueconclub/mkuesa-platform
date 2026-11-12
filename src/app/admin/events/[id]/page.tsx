import type { Metadata } from "next";
import { ContentEditPage, EventRegistrations } from "@/components/admin/content-pages";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit event (admin)", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole(staffRoles, `/admin/events/${id}`);
  return <ContentEditPage kind="events" id={id} extra={<EventRegistrations eventId={id} role={profile.role} />} />;
}
