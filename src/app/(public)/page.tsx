import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, GraduationCap } from "lucide-react";
import { ContentCard } from "@/components/public/content-card";
import { EventCard } from "@/components/public/event-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { association } from "@/config/association";
import { sampleAnnouncements, sampleEvents, sampleResources } from "@/config/sample-content";
import { siteConfig } from "@/config/site";

const pillars = [
  { icon: GraduationCap, title: "Closer to the faculty", text: "Connecting economics students with the faculty.", href: "/about", cta: "About the association" },
  { icon: Briefcase, title: "Closer to the working world", text: "Connecting students with working opportunities.", href: "/opportunities", cta: "See opportunities" },
  { icon: BookOpen, title: "Beyond the lecture room", text: "Extending economics education through learning, research and events.", href: "/learning-hub", cta: "Visit the Learning Hub" },
];

function HeroMotif() {
  return (
    <svg aria-hidden viewBox="0 0 240 180" className="hidden w-72 shrink-0 lg:block xl:w-80">
      {[40, 70, 100, 135, 170].map((h, i) => (
        <rect key={i} x={14 + i * 42} y={180 - h} width="28" height={h} rx="3" className={i === 4 ? "fill-accent-500" : "fill-brand-500"} opacity={0.35 + i * 0.13} />
      ))}
      <path d="M10 70 L90 52 L130 40 L205 12" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-accent-400" />
      <path d="M190 10 L208 10 L206 28" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-400" />
    </svg>
  );
}

export default function HomePage() {
  const upcoming = sampleEvents.filter((e) => e.status === "upcoming").slice(0, 2);
  const featured = sampleResources.slice(0, 3);

  return (
    <>
      <section className="bg-brand-950 text-ivory">
        <Container className="flex items-center justify-between gap-10 py-20 sm:py-28">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">{siteConfig.university}</p>
            <h1 className="max-w-3xl text-5xl text-white sm:text-6xl">{siteConfig.tagline}.</h1>
            <p className="mt-6 max-w-2xl text-lg text-brand-100">
              The {siteConfig.fullName}: connecting students with the faculty and working opportunities, and taking economics beyond the lecture room.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/membership" variant="accent" size="lg">
                Become a member <ArrowRight aria-hidden className="size-4" />
              </Button>
              <Button href="/events" variant="outlineLight" size="lg">
                Upcoming events
              </Button>
            </div>
          </div>
          <HeroMotif />
        </Container>
      </section>

      <Section tone="paper" eyebrow="Who we are" title="Our mission and vision">
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

      <Section eyebrow="What we do" title="Economics, connected">
        <ul className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text, href, cta }) => (
            <li key={title}>
              <Card className="flex h-full flex-col gap-3">
                <Icon aria-hidden className="size-8 text-brand-600" />
                <h3 className="text-xl text-brand-900">{title}</h3>
                <p className="text-muted">{text}</p>
                <Link href={href} className="mt-auto inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                  {cta} <ArrowRight aria-hidden className="size-4" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
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

      <Section tone="paper" eyebrow="Latest" title="Announcements">
        <ul className="grid gap-6 md:grid-cols-3">
          {sampleAnnouncements.map((a) => (
            <li key={a.slug}>
              <ContentCard label="Announcement" title={a.title} summary={a.summary} sample />
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Coming up" title="Upcoming events">
        <ul className="grid gap-6 md:grid-cols-2">
          {upcoming.map((e) => (
            <li key={e.slug}>
              <EventCard event={e} />
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button href="/events" variant="outline">All events</Button>
        </div>
      </Section>

      <Section tone="paper" eyebrow="Learn" title="Featured academic content">
        <ul className="grid gap-6 md:grid-cols-3">
          {featured.map((r) => (
            <li key={r.slug}>
              <ContentCard title={r.title} summary={r.summary} sample />
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button href="/learning-hub" variant="outline">Visit the Learning Hub</Button>
        </div>
      </Section>

      <section className="bg-accent-500 text-ink">
        <Container className="flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl">Take economics beyond the lecture room.</h2>
            <p className="mt-2 text-lg">Join MKUESA and connect with faculty, opportunities and fellow economists.</p>
          </div>
          <Button href="/membership" size="lg" className="bg-brand-950 text-white hover:bg-brand-900">
            Learn about membership
          </Button>
        </Container>
      </section>
    </>
  );
}
