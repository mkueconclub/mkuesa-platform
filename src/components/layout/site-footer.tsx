import Link from "next/link";
import { AffiliationFooter } from "@/components/layout/affiliation-badge";
import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/ui/container";
import { contact } from "@/config/association";
import { footerGroups, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:gap-x-8 md:grid-cols-3 md:py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-12">
        <div className="col-span-2 max-w-sm md:col-span-3 lg:col-span-1">
          <BrandMark light />
          <p className="mt-5 text-sm leading-relaxed">{siteConfig.fullName}.</p>
          <p className="mt-1 font-display text-lg italic text-accent-400">{siteConfig.tagline}</p>
          <AffiliationFooter />
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title} className="min-w-0">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white">{group.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="inline-block py-0.5 text-sm hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.fullName}.
          </p>
          <p>
            Contact:{" "}
            <a href={`mailto:${contact.email}`} className="break-all font-medium text-white underline underline-offset-2 hover:text-accent-400">
              {contact.email}
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
