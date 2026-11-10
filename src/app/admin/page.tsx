import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <main>
      <PagePlaceholder title="Administration" description="Protected area. Authentication and permissions are built in Phase 3." phase="Phase 5" />
    </main>
  );
}
