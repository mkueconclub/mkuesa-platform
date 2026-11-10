import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Member dashboard", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return (
    <main>
      <PagePlaceholder title="Member dashboard" description="Protected area. Authentication and permissions are built in Phase 3." phase="Phase 4" />
    </main>
  );
}
