import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils/cn";

type Tone = "ivory" | "paper" | "dark";

const tones: Record<Tone, string> = {
  ivory: "bg-ivory text-ink",
  paper: "bg-paper text-ink",
  dark: "bg-brand-950 text-ivory",
};

type SectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: Tone;
  id?: string;
  className?: string;
  children?: ReactNode;
};

export function Section({ eyebrow, title, description, tone = "ivory", id, className, children }: SectionProps) {
  const dark = tone === "dark";
  return (
    <section id={id} className={cn("py-16 sm:py-24 lg:py-28", tones[tone], className)}>
      <Container>
        {(eyebrow || title || description) && (
          <header className="mb-10 max-w-3xl lg:mb-14 lg:max-w-4xl">
            {eyebrow && (
              <p className={cn("mb-3 text-xs font-semibold uppercase tracking-[0.18em]", dark ? "text-accent-400" : "text-accent-700")}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h2>}
            {description && <p className={cn("mt-4 text-lg", dark ? "text-brand-100" : "text-muted")}>{description}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}
