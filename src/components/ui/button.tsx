import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "outlineLight";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800 hover:shadow-md",
  accent: "bg-accent-500 text-ink shadow-sm hover:bg-accent-400 hover:shadow-lg hover:shadow-accent-500/25",
  outline: "border border-brand-700 text-brand-700 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  outlineLight: "border border-white/40 text-white hover:border-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

/** Button styling for plain `<a>` elements, e.g. file downloads, which must not go through the client router. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type AsLink = Common & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function Button(props: AsLink | AsButton) {
  if (props.href !== undefined) {
    const { variant = "primary", size = "md", className, children, ...rest } = props;
    return (
      <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant = "primary", size = "md", className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
