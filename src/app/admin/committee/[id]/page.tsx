import type { Metadata } from "next";
import { ContentEditPage } from "@/components/admin/content-pages";

export const metadata: Metadata = { title: "Edit (admin)", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContentEditPage kind="committee" id={id} />;
}
