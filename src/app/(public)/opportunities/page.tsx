import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return <PagePlaceholder title="Opportunities" description="Internships, scholarships, competitions, conferences and career opportunities." phase="Phase 2" />;
}
