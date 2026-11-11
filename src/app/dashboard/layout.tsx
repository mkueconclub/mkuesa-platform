import { PublicShell } from "@/components/layout/public-shell";

// Interim shell; the member-portal layout is built in Phase 4.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
