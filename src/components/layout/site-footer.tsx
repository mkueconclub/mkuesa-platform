import Link from "next/link";
import { AffiliationFooter } from "@/components/layout/affiliation-badge";
import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/ui/container";
import { contact } from "@/config/association";
import { footerGroups, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <Container className="grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <BrandMark light />
          <p className="mt-5 text-sm leading-relaxed">{siteConfig.fullName}.</p>
          <p className="mt-1 font-display text-lg italic text-accent-400">{siteConfig.tagline}</p>
          <AffiliationFooter />
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white">{group.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm hover:text-white hover:underline">
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
            <a href={`mailto:${contact.email}`} className="font-medium text-white underline underline-offset-2 hover:text-accent-400">
              {contact.email}
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
