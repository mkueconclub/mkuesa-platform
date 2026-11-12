import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Page-width wrapper. Wide (100rem) with generous, growing side margins so large screens are used
 * instead of leaving a narrow strip in the middle. Pass a `max-w-*` class to narrow it (e.g. the sign-in card).
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  const hasOwnWidth = className?.split(/\s+/).some((c) => c.startsWith("max-w-"));
  return <div className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16", !hasOwnWidth && "max-w-[100rem]", className)}>{children}</div>;
}
