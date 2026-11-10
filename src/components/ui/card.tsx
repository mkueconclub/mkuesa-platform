import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-brand-100 bg-paper p-6 shadow-sm", className)}>{children}</div>;
}
