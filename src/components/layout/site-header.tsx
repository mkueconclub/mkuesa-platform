"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav, memberActions } from "@/config/site";
import { cn } from "@/lib/utils/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-ivory/95 backdrop-blur">
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <BrandMark />

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-brand-50 hover:text-brand-800",
                isActive(item.href) ? "text-brand-700 underline decoration-accent-500 decoration-2 underline-offset-8" : "text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Button href={memberActions.login.href} variant="ghost">
            {memberActions.login.label}
          </Button>
          <Button href={memberActions.join.href} variant="primary">
            {memberActions.join.label}
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-brand-800 hover:bg-brand-50 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-nav" className="border-t border-brand-100 bg-ivory xl:hidden">
          <Container className="py-4">
            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-3 text-base font-medium hover:bg-brand-50",
                        isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-brand-100 pt-4">
              <Button href={memberActions.login.href} variant="outline" onClick={() => setOpen(false)}>
                {memberActions.login.label}
              </Button>
              <Button href={memberActions.join.href} variant="primary" onClick={() => setOpen(false)}>
                {memberActions.join.label}
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
