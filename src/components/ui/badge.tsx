import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "brand" | "accent" | "neutral";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-800",
  accent: "bg-accent-100 text-accent-800",
  neutral: "bg-ink/5 text-muted",
};

export function Badge({ children, tone = "brand", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
