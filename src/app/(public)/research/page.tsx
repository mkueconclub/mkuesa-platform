import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return <PagePlaceholder title="Research and Publications" description="Student research, articles, economic analysis and association publications." phase="Phase 2" />;
}
