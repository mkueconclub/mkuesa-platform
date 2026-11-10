import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/config/site";

const swatches = [
  { name: "brand-950", cls: "bg-brand-950" },
  { name: "brand-700", cls: "bg-brand-700" },
  { name: "brand-500 (logo purple)", cls: "bg-brand-500" },
  { name: "accent-500 (logo orange)", cls: "bg-accent-500" },
  { name: "ivory", cls: "bg-ivory border border-brand-200" },
  { name: "ink", cls: "bg-ink" },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-brand-950 text-ivory">
        <Container className="py-20 sm:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">{siteConfig.university}</p>
          <h1 className="max-w-3xl text-5xl text-white sm:text-6xl">{siteConfig.tagline}.</h1>
          <p className="mt-6 max-w-2xl text-lg text-brand-100">
            The digital home of the {siteConfig.fullName}: membership, events, learning and research in one place.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/membership" variant="accent" size="lg">
              Explore membership <ArrowRight aria-hidden className="size-4" />
            </Button>
            <Button href="/about" variant="outlineLight" size="lg">
              About MKUESA
            </Button>
          </div>
        </Container>
      </section>

      <Section
        tone="paper"
        eyebrow="Phase 1 preview"
        title="Design system"
        description="Temporary showcase of the foundation components for your review. Replaced by the real home page content in Phase 2."
      >
        <div className="space-y-12">
          <div>
            <h3 className="mb-4 text-xl">Colour</h3>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {swatches.map((s) => (
                <li key={s.name}>
                  <div className={`h-16 rounded-lg ${s.cls}`} />
                  <p className="mt-2 text-xs text-muted">{s.name}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xl">Buttons and badges</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Badge>Brand</Badge>
              <Badge tone="accent">Accent</Badge>
              <Badge tone="neutral">Neutral</Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-xl">Card</h3>
              <p className="mt-2 text-muted">Used for events, resources, publications and opportunities.</p>
            </Card>
            <Card className="space-y-4">
              <Input label="Full name" placeholder="Sample input" hint="Helper text appears here." />
              <Input label="Email" type="email" defaultValue="invalid" error="Example of an error message." />
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
