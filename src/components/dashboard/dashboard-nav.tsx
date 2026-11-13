"use client";

import { Award, BadgeCheck, GraduationCap, BookOpen, CalendarDays, FileText, LayoutDashboard, Megaphone, User } from "lucide-react";
import { PortalNav } from "@/components/layout/portal-nav";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/membership", label: "Membership", icon: BadgeCheck },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/resources", label: "Resources", icon: BookOpen },
  { href: "/dashboard/research", label: "My research", icon: FileText },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/alumni", label: "Alumni", icon: GraduationCap },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
] as const;

/** Compact menu on phones and tablets, sidebar from the lg breakpoint. */
export function DashboardNav() {
  return <PortalNav label="Member portal" items={items.map((i) => ({ ...i }))} />;
}
