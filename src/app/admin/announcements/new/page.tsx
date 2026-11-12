import type { Metadata } from "next";
import { ContentNewPage } from "@/components/admin/content-pages";

export const metadata: Metadata = { title: "New (admin)", robots: { index: false, follow: false } };

export default function Page() {
  return <ContentNewPage kind="announcements" />;
}
