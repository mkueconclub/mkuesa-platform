import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Shared building blocks for the Alumni Network look: pill buttons, panels, status chips, hero banner, progress ring. */
type Variant = "solid" | "glow" | "soft" | "ghost" | "dark";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";
const variants: Record<Variant, string> = {
  solid: "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-700/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-700/40",
  glow: "bg-accent-500 text-ink shadow-lg shadow-accent-500/30 hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-xl hover:shadow-accent-500/40",
  soft: "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200 hover:-translate-y-0.5 hover:bg-brand-100",
  ghost: "text-brand-800 hover:bg-brand-50",
  dark: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20",
};
const sizes: Record<Size, string> = { md: "h-11 px-6 text-sm", lg: "h-14 px-8 text-base" };

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type AsLink = Common & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function AButton(props: AsLink | AsButton) {
  const { variant = "solid", size = "md", className, children } = props;
  const cls = cn(base, variants[variant], sizes[size], className);
  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    return <Link className={cls} {...rest}>{children}</Link>;
  }
  const { variant: _v, size: _s, className: _c, children: _ch, type = "button", ...rest } = props;
  return <button type={type} className={cls} {...rest}>{children}</button>;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-paper p-6 ring-1 ring-brand-100 shadow-[0_24px_48px_-32px_rgb(34_1_49/0.35)] sm:p-8", className)}>
      {children}
    </section>
  );
}

const chipTones = {
  live: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  review: "bg-accent-50 text-accent-800 ring-accent-200",
  muted: "bg-ink/5 text-muted ring-ink/10",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
} as const;
const dotTones = { live: "bg-emerald-600", review: "bg-accent-500", muted: "bg-slate", brand: "bg-brand-500" } as const;

export function Chip({ tone = "brand", children }: { tone?: keyof typeof chipTones; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset", chipTones[tone])}>
      <span aria-hidden className={cn("size-1.5 rounded-full", dotTones[tone])} />
      {children}
    </span>
  );
}

/** Dark gradient banner that opens every alumni page. */
export function AlumniHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <header className="bg-hero-glow relative isolate mb-8 overflow-hidden rounded-3xl px-6 py-9 text-ivory sm:px-10 sm:py-12">
      <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
      <p className="eyebrow-like text-xs font-bold uppercase tracking-[0.2em] text-accent-400">{eyebrow}</p>
      <h1 className="mt-3 max-w-2xl text-balance text-4xl text-white sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-pretty text-lg text-brand-100">{description}</p>}
      {children && <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="size-16 -rotate-90" role="img" aria-label={`${value}% complete`}>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-brand-100" />
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="stroke-accent-500 transition-all duration-700" />
    </svg>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-display font-semibold text-ink ring-4 ring-white/10", size === "lg" ? "size-16 text-2xl" : "size-11 text-lg")}>
      {initials || "A"}
    </span>
  );
}

/** Shown once an alumnus is followed by more than 50 approved members. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span title="Followed by more than 50 approved members" className={cn("inline-flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-ink", className)}>
      <BadgeCheck aria-hidden className="size-3.5" /> Verified
    </span>
  );
}
