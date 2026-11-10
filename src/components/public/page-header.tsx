import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="bg-brand-950 text-ivory">
      <Container className="py-14 sm:py-20">
        {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl text-white sm:text-5xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg text-brand-100">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </div>
  );
}
