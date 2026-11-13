"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/alumni", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/alumni/profile", label: "My profile", icon: UserRound },
  { href: "/alumni/connect", label: "Alumni Connect", icon: Users },
  { href: "/alumni/opportunities", label: "Share an opportunity", icon: Briefcase },
] as const;

export function AlumniNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Alumni portal" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:flex-col">
        {items.map(({ href, label, icon: Icon, ...r }) => {
          const active = "exact" in r ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                  active ? "bg-white text-brand-900 shadow-lg shadow-black/20" : "text-brand-100 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon aria-hidden className={cn("size-4", active && "text-accent-600")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
