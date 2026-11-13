import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Briefcase, CalendarDays, ClipboardCheck, GraduationCap, HeartHandshake, Library, UserPlus } from "lucide-react";
import { AButton } from "@/components/alumni/ui";
import { AffiliationBand, AffiliationChip } from "@/components/layout/affiliation-badge";
import { ContentCard } from "@/components/public/content-card";
import { EventCard } from "@/components/public/event-card";
import { HeroVisual } from "@/components/public/hero-visual";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { association, currentAcademicYear } from "@/config/association";
import { sampleAnnouncements, sampleEvents, sampleResources } from "@/config/sample-content";
import { siteConfig } from "@/config/site";

const quickLinks = [
  { icon: UserPlus, title: "Become a member", text: "Join the association", href: "/membership" },
  { icon: CalendarDays, title: "Events", text: "See what is coming up", href: "/events" },
  { icon: Library, title: "Learning Hub", text: "Notes, guides and courses", href: "/learning-hub" },
  { icon: Briefcase, title: "Opportunities", text: "Internships and more", href: "/opportunities" },
];

const pillars = [
  { icon: GraduationCap, title: "Closer to the faculty", text: "Connecting economics students with the faculty.", href: "/about", cta: "About the association" },
  { icon: Briefcase, title: "Closer to the working world", text: "Connecting students with working opportunities.", href: "/opportunities", cta: "See opportunities" },
  { icon: BookOpen, title: "Beyond the lecture room", text: "Extending economics education through learning, research and events.", href: "/learning-hub", cta: "Visit the Learning Hub" },
];

const steps = [
  { icon: UserPlus, title: "Create your account", text: "Register with your email address and confirm it." },
  { icon: ClipboardCheck, title: "Apply for membership", text: `Submit your membership application for the ${currentAcademicYear} academic year.` },
  { icon: BadgeCheck, title: "Get approved", text: "The committee reviews your application. Once approved you receive a membership number and full member access." },
];

const card = "rounded-3xl bg-paper ring-1 ring-brand-100 shadow-[0_24px_48px_-32px_rgb(34_1_49/0.35)]";

function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <div className="mt-10">
      <AButton href={href} variant="soft">{children} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" /></AButton>
    </div>
  );
}

export default function HomePage() {
  const upcoming = sampleEvents.filter((e) => e.status === "upcoming").slice(0, 2);
  const featured = sampleResources.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-hero-glow relative isolate overflow-hidden text-ivory">
        <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
        <Container className="flex items-center justify-between gap-12 pb-32 pt-16 sm:pb-40 sm:pt-24 lg:pt-28 xl:pb-48">
          <div className="max-w-2xl xl:max-w-3xl">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent-400">
              <span aria-hidden className="size-1.5 rounded-full bg-accent-400" />
              {siteConfig.university}
            </p>
            <h1 className="animate-rise mt-6 text-balance text-5xl text-white sm:text-6xl lg:text-7xl xl:text-8xl" style={{ ["--delay" as string]: "80ms" }}>
              {siteConfig.tagline}<span className="text-accent-400">.</span>
            </h1>
            <p className="animate-rise mt-6 max-w-xl text-pretty text-lg text-brand-100 sm:text-xl xl:max-w-2xl xl:text-2xl" style={{ ["--delay" as string]: "160ms" }}>
              The {siteConfig.fullName}: connecting students with the faculty and working opportunities, and taking economics beyond the lecture room.
            </p>
            <div className="animate-rise mt-10 flex flex-wrap gap-3" style={{ ["--delay" as string]: "240ms" }}>
              <AButton href="/membership" variant="glow" size="lg">
                Become a member <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </AButton>
              <AButton href="/events" variant="dark" size="lg">Upcoming events</AButton>
            </div>
            <AffiliationChip className="animate-rise mt-8" />
          </div>
          <HeroVisual />
        </Container>
      </section>

      {/* Quick links overlap the hero */}
      <section aria-label="Quick links" className="relative z-10 -mt-16 sm:-mt-20">
        <Container>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {quickLinks.map(({ icon: Icon, title, text, href }) => (
              <li key={href}>
                <Link href={href} className={`${card} group flex h-full flex-col gap-4 p-5 transition duration-300 hover:-translate-y-1 hover:ring-brand-300 sm:p-6`}>
                  <span className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-gradient-to-br group-hover:from-brand-700 group-hover:to-brand-500 group-hover:text-white">
                      <Icon aria-hidden className="size-6" />
                    </span>
                    <ArrowUpRight aria-hidden className="size-5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                  </span>
                  <span>
                    <span className="block font-display text-xl leading-tight text-brand-900">{title}</span>
                    <span className="mt-1 block text-sm text-muted">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <AffiliationBand />

      {/* Mission and vision */}
      <Section eyebrow="Who we are" title="Our mission and vision">
        <div className="reveal grid gap-6 lg:grid-cols-5">
          <div className="bg-hero-glow relative isolate overflow-hidden rounded-3xl p-8 text-white sm:p-12 lg:col-span-3">
            <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-400">Mission</p>
            <p className="mt-5 text-balance font-display text-2xl leading-snug sm:text-3xl">{association.mission}</p>
          </div>
          <div className={`${card} flex flex-col justify-center border-l-4 border-l-accent-500 p-8 sm:p-10 lg:col-span-2`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-700">Vision</p>
            <p className="mt-5 text-lg text-ink">{association.vision}</p>
          </div>
        </div>
      </Section>

      {/* What we do */}
      <Section tone="paper" eyebrow="What we do" title="Economics, connected">
        <ul className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text, href, cta }, i) => (
            <li key={title} className="reveal">
              <div className={`${card} group relative flex h-full flex-col gap-4 overflow-hidden p-8 transition duration-300 hover:-translate-y-1`}>
                <span aria-hidden className="absolute -right-2 -top-5 font-display text-8xl font-semibold text-brand-100">{i + 1}</span>
                <span className="relative flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Icon aria-hidden className="size-6" /></span>
                <h3 className="relative text-2xl text-brand-900">{title}</h3>
                <p className="relative text-muted">{text}</p>
                <Link href={href} className="relative mt-auto inline-flex items-center gap-1.5 pt-2 font-semibold text-brand-700 hover:underline">
                  {cta} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Core values */}
      <Section tone="dark" eyebrow="Core values" title="What we stand for">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {association.values.map((v, i) => (
            <li key={v} className="reveal group rounded-3xl bg-white/[0.05] p-7 ring-1 ring-inset ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09] hover:ring-accent-400/60">
              <span className="font-display text-sm text-accent-400">0{i + 1}</span>
              <p className="mt-8 font-display text-3xl text-white">{v}</p>
              <span aria-hidden className="mt-5 block h-1 w-8 rounded-full bg-accent-500 transition-all duration-300 group-hover:w-16" />
            </li>
          ))}
        </ul>
      </Section>

      {/* How membership works */}
      <Section eyebrow="Membership" title="Join in three steps">
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={`${card} reveal relative overflow-hidden p-8`}>
              <span aria-hidden className="absolute -right-2 -top-5 font-display text-8xl font-semibold text-brand-100">{i + 1}</span>
              <Icon aria-hidden className="relative size-8 text-brand-600" />
              <h3 className="relative mt-5 text-xl text-brand-900">{title}</h3>
              <p className="relative mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <AButton href="/register" size="lg">Create an account</AButton>
          <AButton href="/membership" variant="soft" size="lg">Membership details</AButton>
        </div>
      </Section>

      {/* Announcements */}
      <Section tone="paper" eyebrow="Latest" title="Announcements">
        <ul className="grid gap-6 md:grid-cols-3">
          {sampleAnnouncements.map((a) => (
            <li key={a.slug} className="reveal">
              <ContentCard label="Announcement" title={a.title} summary={a.summary} sample />
            </li>
          ))}
        </ul>
      </Section>

      {/* Events */}
      <Section eyebrow="Coming up" title="Upcoming events">
        <ul className="grid gap-6 md:grid-cols-2">
          {upcoming.map((e) => (
            <li key={e.slug} className="reveal">
              <EventCard event={e} />
            </li>
          ))}
        </ul>
        <MoreLink href="/events">All events</MoreLink>
      </Section>

      {/* Learning */}
      <Section tone="paper" eyebrow="Learn" title="Featured academic content">
        <ul className="grid gap-6 md:grid-cols-3">
          {featured.map((r) => (
            <li key={r.slug} className="reveal">
              <ContentCard title={r.title} summary={r.summary} sample />
            </li>
          ))}
        </ul>
        <MoreLink href="/learning-hub">Visit the Learning Hub</MoreLink>
      </Section>

      {/* Alumni */}
      <section className="bg-ivory py-16 sm:py-24">
        <Container>
          <div className="bg-hero-glow relative isolate flex flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-400"><HeartHandshake aria-hidden className="size-4" /> MKU economics alumni</p>
              <h2 className="mt-4 text-balance text-3xl sm:text-4xl lg:text-5xl">Graduated? Open the door behind you.</h2>
              <p className="mt-4 text-lg text-brand-100">Share attachments, scholarships and mentorship with the next generation of MKU economists.</p>
            </div>
            <AButton href="/alumni-network" variant="glow" size="lg" className="shrink-0">Join the Alumni Network</AButton>
          </div>
        </Container>
      </section>

      {/* Closing call to action */}
      <section className="bg-cta-glow text-white">
        <Container className="flex flex-col items-start justify-between gap-8 py-16 sm:py-20 md:flex-row md:items-center">
          <div className="max-w-3xl">
            <h2 className="text-balance text-3xl sm:text-5xl lg:text-6xl">Take economics beyond the lecture room.</h2>
            <p className="mt-4 text-lg text-brand-100">Join MKUESA and connect with faculty, opportunities and fellow economists.</p>
          </div>
          <AButton href="/membership" variant="glow" size="lg" className="shrink-0">
            Learn about membership <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
          </AButton>
        </Container>
      </section>
    </>
  );
}
