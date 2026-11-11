import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Member login" };

const notices: Record<string, string> = {
  confirm: "That confirmation link is invalid or has expired. Sign in, or register again to get a new link.",
  profile: "Your account has no profile yet. Please contact the association.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthCard title="Member login" description="Sign in to your MKUESA account.">
      <LoginForm next={safeNext(next)} notice={error ? notices[error] : undefined} />
    </AuthCard>
  );
}
