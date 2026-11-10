import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Learning Hub" };

export default function LearningHubPage() {
  return <PagePlaceholder title="Economics Learning Hub" description="Economics, finance and investment resources, academic materials, courses and video lessons." phase="Phase 2" />;
}
