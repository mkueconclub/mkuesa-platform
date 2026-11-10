import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return <PagePlaceholder title="Events" description="Upcoming and past events, details and registration." phase="Phase 2" />;
}
