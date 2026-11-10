import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/page-placeholder";

export const metadata: Metadata = { title: "Member login" };

export default function LoginPage() {
  return <PagePlaceholder title="Member login" description="Secure sign-in for MKUESA members." phase="Phase 3" />;
}
