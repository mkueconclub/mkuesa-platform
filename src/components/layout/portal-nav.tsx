"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type PortalNavItem = { href: string; label: string; icon?: LucideIcon; exact?: boolean };

/**
 * Navigation shared by the member portal and the admin portal.
 * Below `lg` it collapses into one button that names the current section and opens a tidy grid of links
 * (twelve sideways-scrolling tabs are hard to find on a phone). From `lg` it is a plain sidebar list.
 * The most specific matching link is the active one.
 */
export function PortalNav({ items, label }: { items: PortalNavItem[]; label: string }) {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so it closes by itself after any navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const matches = items.filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)));
  const activeHref = [...matches].sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const current = items.find((i) => i.href === activeHref) ?? items[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-brand-50",
      active ? "bg-brand-100 text-brand-900" : "text-ink",
    );

  return (
    <nav aria-label={label}>
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="portal-nav-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-brand-200 bg-paper px-4 py-2.5 text-left text-sm font-semibold text-brand-900 shadow-sm"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {current?.icon && <current.icon aria-hidden className="size-4 shrink-0" />}
            <span className="truncate">
              <span className="font-normal text-muted">{label}: </span>
              {current?.label}
            </span>
          </span>
          <ChevronDown aria-hidden className={cn("size-5 shrink-0 transition-transform duration-200", open && "rotate-180")} />
        </button>
        {open && (
          <ul id="portal-nav-menu" className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-brand-100 bg-paper p-2 shadow-lg sm:grid-cols-3">
            {items.map(({ href, label: text, icon: Icon }) => (
              <li key={href} className="min-w-0">
                <Link href={href} aria-current={href === activeHref ? "page" : undefined} className={linkClass(href === activeHref)}>
                  {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
                  <span className="min-w-0 break-words">{text}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="hidden gap-1 lg:flex lg:flex-col">
        {items.map(({ href, label: text, icon: Icon }) => (
          <li key={href}>
            <Link href={href} aria-current={href === activeHref ? "page" : undefined} className={linkClass(href === activeHref)}>
              {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
