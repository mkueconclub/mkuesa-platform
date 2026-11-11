import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetRequestForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Reset your password" description="Enter your email and we will send you a link to choose a new password.">
      <ResetRequestForm />
    </AuthCard>
  );
}
