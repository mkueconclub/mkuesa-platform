"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { mainNav, memberActions } from "@/config/site";
import { logoutAction } from "@/lib/auth/actions";
import type { HeaderAccount } from "@/lib/auth/account";
import { cn } from "@/lib/utils/cn";

/**
 * Desktop-only navigation that takes over from the top bar once the page is scrolled.
 * A floating panel slides in from the left; the toggle morphs between a menu icon and a cross
 * and can collapse the panel at any time (Escape also closes it). Hidden below the `xl` breakpoint,
 * where the normal mobile menu is used.
 */
export function SideDock({ docked, account }: { docked: boolean; account: HeaderAccount | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelOpen = docked && open;

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const line = "absolute left-0 h-0.5 rounded-full bg-current transition-all duration-500 ease-spring";

  return (
    <div className="hidden xl:block">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={panelOpen}
        aria-controls="side-dock"
        aria-label={open ? "Close navigation" : "Open navigation"}
        inert={!docked}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group fixed left-5 top-5 z-50 flex size-12 items-center justify-center rounded-2xl shadow-lg shadow-black/25 transition-all duration-500 ease-spring hover:scale-105 active:scale-95",
          docked ? "rotate-0 scale-100 opacity-100" : "pointer-events-none -rotate-90 scale-50 opacity-0",
          open ? "bg-brand-900 text-white ring-1 ring-white/20" : "bg-accent-500 text-ink hover:bg-accent-400",
        )}
      >
        {docked && !open && (
          <span aria-hidden className="absolute inset-0 -z-10 animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_3] rounded-2xl bg-accent-500/60" />
        )}
        <span aria-hidden className="relative block size-5">
          <span className={cn(line, open ? "top-[9px] w-full rotate-45" : "top-0 w-full")} />
          <span className={cn(line, open ? "top-[9px] w-full scale-x-0 opacity-0" : "top-[9px] w-3/4 group-hover:w-full")} />
          <span className={cn(line, open ? "top-[9px] w-full -rotate-45" : "top-[18px] w-1/2 group-hover:w-full")} />
        </span>
      </button>

      <aside
        id="side-dock"
        inert={!panelOpen}
        className={cn(
          "fixed left-5 top-[5.25rem] z-50 max-h-[calc(100dvh-6.5rem)] w-64 origin-top-left overflow-y-auto rounded-3xl border border-white/10 bg-brand-950/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-500 ease-out-expo",
          panelOpen ? "translate-x-0 scale-100 opacity-100" : "pointer-events-none -translate-x-8 scale-95 opacity-0",
        )}
      >
        <BrandMark light className="px-1 pb-4" />
        <nav aria-label="Side navigation" className="border-t border-white/10 pt-3">
          <ul className="space-y-1">
            {mainNav.map((item, i) => {
              const active = isActive(item.href);
              return (
                <li
                  key={item.href}
                  className={cn("transition-all duration-500 ease-out-expo", panelOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0")}
                  style={{ transitionDelay: panelOpen ? `${120 + i * 45}ms` : "0ms" }}
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-full bg-accent-500" />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
          {account ? (
            <>
              <Button href={account.dashboardHref} variant="accent">{account.dashboardLabel}</Button>
              {account.adminHref && <Button href={account.adminHref} variant="outlineLight">Administration</Button>}
              <form action={logoutAction}><Button type="submit" variant="outlineLight" className="w-full">Sign out</Button></form>
            </>
          ) : (
            <>
              <Button href={memberActions.login.href} variant="outlineLight">{memberActions.login.label}</Button>
              <Button href={memberActions.join.href} variant="accent">{memberActions.join.label}</Button>
            </>
          )}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-200 transition-colors hover:text-white"
          >
            <ArrowUp aria-hidden className="size-3.5" /> Back to top
          </button>
        </div>
      </aside>
    </div>
  );
}
