import type { Metadata } from "next";
import { ContentEditPage } from "@/components/admin/content-pages";
import { ExecutiveApprovalCard } from "@/components/executives/approval-card";
import { staffRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit (admin)", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireRole(staffRoles, `/admin/committee/${id}`);
  return <ContentEditPage kind="committee" id={id} extra={<ExecutiveApprovalCard id={id} role={me.role} />} />;
}
