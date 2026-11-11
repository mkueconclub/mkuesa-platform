import type { ReactNode } from "react";

/** The single <h1> of each member-portal page. */
export function PageTitle({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 max-w-3xl">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">{eyebrow}</p>}
      <h1 className="text-3xl text-brand-900 sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-lg text-muted">{description}</p>}
      {children}
    </header>
  );
}
