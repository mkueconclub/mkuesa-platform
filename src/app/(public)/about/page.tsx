import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <PagePlaceholder title="About MKUESA" description="History, vision and mission, objectives, constitution and executive leadership." phase="Phase 2" />;
}
