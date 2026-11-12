"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BadgeCheck, BookOpen, CalendarDays, FileText, LayoutDashboard, Megaphone, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/membership", label: "Membership", icon: BadgeCheck },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/resources", label: "Resources", icon: BookOpen },
  { href: "/dashboard/research", label: "My research", icon: FileText },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
] as const;

/** Tabs that scroll sideways on phones and stack as a sidebar from the lg breakpoint. */
export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Member portal" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon, ...rest }) => {
          const active = "exact" in rest && rest.exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-brand-50",
                  active ? "bg-brand-100 text-brand-900" : "text-ink",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
