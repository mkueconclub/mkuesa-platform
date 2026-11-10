import { PublicShell } from "@/components/layout/public-shell";

// Interim shell; the real auth layout is designed in Phase 3.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
