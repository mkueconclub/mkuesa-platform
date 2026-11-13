import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetRequestForm } from "@/components/auth/auth-forms";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthCard title="Reset your password" description="Enter your email and we will send you a link to choose a new password.">
      {error === "expired" && (
        <Notice tone="pending" className="mb-4">
          That reset link is invalid or has expired. Enter your email to get a new one.
        </Notice>
      )}
      <ResetRequestForm />
    </AuthCard>
  );
}
