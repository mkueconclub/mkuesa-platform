"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavItem } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";

/** Tabs on phones, sidebar from lg. The most specific matching link is the active one. */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const matches = items.filter((i) => (i.href === "/admin" ? pathname === "/admin" : pathname === i.href || pathname.startsWith(`${i.href}/`)));
  const active = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Administration" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((i) => (
          <li key={i.href} className="shrink-0">
            <Link
              href={i.href}
              aria-current={i.href === active ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-brand-50",
                i.href === active ? "bg-brand-100 text-brand-900" : "text-ink",
              )}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
