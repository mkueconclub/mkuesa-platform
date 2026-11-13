import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AuthCard
      wide
      title="Create an account"
      description="Use Google for one-click sign-up, or register with any email you can access. You will apply for membership after signing in."
    >
      <RegisterForm />
    </AuthCard>
  );
}
