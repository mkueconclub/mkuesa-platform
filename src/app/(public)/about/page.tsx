import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { association, contact, visibleCommittee } from "@/config/association";
import { affiliation, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.fullName}: our mission, vision, values and leadership.`,
};

export default function AboutPage() {
  const committee = visibleCommittee();
  const named = committee.some((m) => m.name);
  return (
    <>
      <PageHeader eyebrow="About" title={`About ${siteConfig.name}`} description={siteConfig.fullName} />

      <Section tone="paper" eyebrow="Purpose" title="Mission and vision">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-accent-500">
            <h3 className="text-2xl text-brand-900">Mission</h3>
            <p className="mt-3 text-lg">{association.mission}</p>
          </Card>
          <Card className="border-l-4 border-l-brand-500">
            <h3 className="text-2xl text-brand-900">Vision</h3>
            <p className="mt-3 text-lg">{association.vision}</p>
          </Card>
        </div>
      </Section>

      <Section tone="dark" eyebrow="Core values" title="What we stand for">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {association.values.map((v, i) => (
            <li key={v} className="rounded-xl border border-white/15 p-6">
              <span className="font-display text-sm text-accent-400">0{i + 1}</span>
              <p className="mt-2 font-display text-2xl text-white">{v}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="paper" eyebrow="Affiliation" title="Part of a national network">
        <p className="max-w-3xl text-lg">
          {siteConfig.name} is a member of the{" "}
          <a href={affiliation.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
            {affiliation.name} ({affiliation.short})<span className="sr-only"> (opens in a new tab)</span>
          </a>
          , the national body for economics students.
        </p>
      </Section>

      <Section eyebrow="Leadership" title="Executive committee">
        <p className="mb-8 max-w-3xl text-lg">
          The association is led by an executive committee of {committee.length} offices. To reach the committee, write to{" "}
          <a href={`mailto:${contact.email}`} className="font-semibold text-brand-700 underline">{contact.email}</a>.
        </p>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {committee.map((m) => (
            <li key={m.title}>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-700">{m.title}</p>
                {named && m.name && <p className="mt-2 font-display text-2xl text-brand-900">{m.name}</p>}
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
