import { PublicShell } from "@/components/layout/public-shell";

// Gives pages under /auth (such as "Email verified") the same header and footer as the login pages.
export default function AuthConfirmLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
