import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AuthCard title="Create an account" description="Register with any email address you can access. You will apply for membership after signing in.">
      <RegisterForm />
    </AuthCard>
  );
}
