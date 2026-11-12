import type { Metadata } from "next";
import { ContentListPage } from "@/components/admin/content-pages";

export const metadata: Metadata = { title: "Events (admin)", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  return <ContentListPage kind="events" searchParams={searchParams} />;
}
