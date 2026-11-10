import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <PagePlaceholder title="Contact" description="Official contact information, contact form and social media links." phase="Phase 2" />;
}
