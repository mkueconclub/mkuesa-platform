import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { KesaLogo } from "@/components/layout/kesa-logo";
import { Container } from "@/components/ui/container";
import { affiliation } from "@/config/site";
import { cn } from "@/lib/utils/cn";

const linkProps = { href: affiliation.url, target: "_blank", rel: "noopener noreferrer" } as const;
const newTab = <span className="sr-only"> (opens in a new tab)</span>;

/** Compact pill for dark backgrounds (hero). */
export function AffiliationChip({ className }: { className?: string }) {
  return (
    <a
      {...linkProps}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] py-1.5 pl-1.5 pr-4 text-left backdrop-blur transition hover:border-white/40 hover:bg-white/10",
        className,
      )}
    >
      <KesaLogo className="size-9 rounded-full" />
      <span className="leading-tight">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent-400">Proud member of</span>
        <span className="block text-sm font-semibold text-white">
          {affiliation.name} <span className="text-brand-200">({affiliation.short})</span>
        </span>
      </span>
      <ArrowUpRight aria-hidden className="size-4 text-brand-200 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      {newTab}
    </a>
  );
}

/** Full-width official affiliation band for the landing page. */
export function AffiliationBand() {
  return (
    <section aria-label="Affiliation" className="bg-ivory pt-12 sm:pt-16">
      <Container>
        <a
          {...linkProps}
          className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-brand-100 bg-paper p-5 shadow-sm transition duration-300 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 sm:flex-row sm:items-center sm:gap-7 sm:p-6"
        >
          <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-accent-500 to-brand-600" />
          <KesaLogo className="ml-1.5 size-20 rounded-2xl border border-brand-100 ring-0 sm:size-24" />
          <div className="flex-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">
              <BadgeCheck aria-hidden className="size-4" /> Official affiliation
            </p>
            <p className="mt-1.5 font-display text-2xl text-brand-900 sm:text-3xl">
              Proud member of the {affiliation.name} <span className="text-brand-600">({affiliation.short})</span>
            </p>
            <p className="mt-1.5 max-w-2xl text-muted">
              MKUESA is a member association of KESA, a network of university economics students&rsquo; associations across Kenya.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700 group-hover:underline">
            Visit kesakenya.org
            <ArrowUpRight aria-hidden className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          {newTab}
        </a>
      </Container>
    </section>
  );
}

/** Small mark for the footer. */
export function AffiliationFooter() {
  return (
    <a {...linkProps} className="group mt-6 inline-flex items-center gap-3 text-sm hover:text-white">
      <KesaLogo className="size-10 rounded-lg" />
      <span className="leading-tight">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-200">Member of</span>
        <span className="block font-semibold text-white group-hover:underline">{affiliation.name}</span>
      </span>
      {newTab}
    </a>
  );
}
