import type { Metadata } from "next";
import { ContentListPage } from "@/components/admin/content-pages";

export const metadata: Metadata = { title: "Publications (admin)", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  return <ContentListPage kind="research" searchParams={searchParams} />;
}
