import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "sample" | "pending";

const tones: Record<Tone, string> = {
  sample: "border-accent-200 bg-accent-50 text-accent-800",
  pending: "border-dashed border-brand-300 bg-brand-50 text-brand-800",
};

/** sample = placeholder content shown for layout review; pending = official info not yet supplied. */
export function Notice({ tone = "sample", title, children, className, id }: { tone?: Tone; title?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} role="note" className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
    </div>
  );
}
