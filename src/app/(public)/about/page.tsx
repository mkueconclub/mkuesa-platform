import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { association, visibleCommittee } from "@/config/association";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const committee = visibleCommittee();
  return (
    <>
      <PageHeader eyebrow="About" title={`About ${siteConfig.name}`} description={siteConfig.fullName} />

      <Section tone="paper" eyebrow="History" title="Background">
        <Notice tone="pending" title="To be supplied">
          The association&rsquo;s history and background will be added once provided by the executive committee.
        </Notice>
      </Section>

      <Section eyebrow="Purpose" title="Mission and vision">
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

      <Section tone="paper" eyebrow="Objectives" title="Association objectives">
        <Notice tone="pending" title="To be supplied">
          The official objectives will be added from the association&rsquo;s constitution.
        </Notice>
      </Section>

      <Section eyebrow="Governance" title="Constitution and governance">
        <Notice tone="pending" title="To be supplied">
          The constitution and governance information will be published here once supplied.
        </Notice>
      </Section>

      <Section tone="paper" eyebrow="Leadership" title="Executive committee">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {committee.map((m) => (
            <li key={m.title}>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-700">{m.title}</p>
                <p className="mt-2 font-display text-2xl text-brand-900">{m.name ?? "To be announced"}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
