import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Membership" };

export default function MembershipPage() {
  return <PagePlaceholder title="Membership" description="Membership information, benefits, requirements and registration." phase="Phase 2" />;
}
