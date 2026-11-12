import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CardProps = { children: ReactNode; className?: string; interactive?: boolean };

/** `interactive` adds a gentle lift for cards that are links or contain one. */
export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-100 bg-paper p-6 shadow-sm",
        interactive && "transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5",
        className,
      )}
    >
      {children}
    </div>
  );
}
