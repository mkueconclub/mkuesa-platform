import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  GraduationCap,
  Handshake,
  LibraryBig,
  Mail,
  UsersRound,
} from "lucide-react";
import { AButton } from "@/components/alumni/ui";
import { AffiliationBand, AffiliationChip } from "@/components/layout/affiliation-badge";
import { ContentCard } from "@/components/public/content-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { association, currentAcademicYear } from "@/config/association";
import { sampleAnnouncements, sampleEvents, sampleResources } from "@/config/sample-content";
import { siteConfig } from "@/config/site";
import { formatEventDate, dateParts } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Economics Students Association",
  description:
    "Connect with the Mount Kenya University Economics Students Association. Discover membership, events, learning resources, research and opportunities for future economists.",
  openGraph: {
    title: "MKUESA | Think bigger. Shape what comes next.",
    description:
      "A community for curious minds, future economists and changemakers at Mount Kenya University.",
    type: "website",
  },
};

const quickLinks = [
  { icon: UsersRound, title: "Membership", text: "Find your people and belong", href: "/membership", number: "01" },
  { icon: CalendarDays, title: "Events", text: "Learn, connect and participate", href: "/events", number: "02" },
  { icon: LibraryBig, title: "Learning hub", text: "Build knowledge beyond class", href: "/learning-hub", number: "03" },
  { icon: BriefcaseBusiness, title: "Opportunities", text: "Take your next career step", href: "/opportunities", number: "04" },
];

const pillars = [
  { icon: GraduationCap, title: "Academic growth", text: "Learn from peers, faculty and practitioners through shared knowledge, academic support and practical experiences.", href: "/learning-hub", cta: "Explore learning" },
  { icon: ChartNoAxesCombined, title: "Economic thinking", text: "Connect classroom theory to the real questions shaping businesses, communities and the Kenyan economy.", href: "/research", cta: "Explore research" },
  { icon: Handshake, title: "Professional community", text: "Build meaningful relationships, discover opportunities and grow alongside a community that wants to see you thrive.", href: "/opportunities", cta: "Find opportunities" },
];

const steps = [
  { icon: UsersRound, title: "Create your account", text: "Register with your email address and confirm your account." },
  { icon: ClipboardIcon, title: "Apply for membership", text: `Complete your membership application for the ${currentAcademicYear} academic year.` },
  { icon: BadgeCheck, title: "Get involved", text: "Once approved, access member features and start taking part in the association." },
];

function ClipboardIcon({ className }: { className?: string }) {
  return <BookOpen aria-hidden className={className} />;
}

export default function HomePage() {
  const upcoming = sampleEvents.filter((event) => event.status === "upcoming").slice(0, 3);
  const featured = sampleResources.slice(0, 3);

  return (
    <>
      {/* Full-bleed editorial hero: the image sits behind the headline */}
      <section className="mkuesa-hero relative isolate overflow-hidden bg-brand-950 text-white">
        <Image
          src="/images/mkuesa-student-collaboration.webp"
          alt="Black African economics students collaborating around a laptop"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-[center_42%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(34,1,49,0.98)_0%,rgba(34,1,49,0.88)_38%,rgba(34,1,49,0.50)_68%,rgba(34,1,49,0.20)_100%)] max-md:bg-[linear-gradient(90deg,rgba(34,1,49,0.94)_0%,rgba(34,1,49,0.78)_62%,rgba(34,1,49,0.52)_100%)]" />
        <div aria-hidden className="mkuesa-hero-grid absolute inset-0 -z-10" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-brand-950/75 to-transparent" />
        <Container className="relative flex min-h-[660px] items-center pb-28 pt-16 sm:min-h-[720px] sm:pb-32 sm:pt-20 lg:min-h-[760px] lg:py-24">
          <div className="relative z-10 max-w-3xl py-4 lg:py-10">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/20 bg-brand-950/35 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.17em] text-brand-100 backdrop-blur-md sm:text-xs">
              <span className="size-2 rounded-full bg-accent-400 shadow-[0_0_0_4px_rgb(240_135_47/0.14)]" />
              {siteConfig.university} · Economics community
            </p>
            <h1 className="animate-rise mt-7 max-w-[13ch] text-balance font-display text-[clamp(3.2rem,7.2vw,7rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-white" style={{ ["--delay" as string]: "80ms" }}>
              Think bigger. <span className="text-accent-400">Shape</span> what comes next.
            </h1>
            <p className="animate-rise mt-7 max-w-xl text-pretty text-base leading-relaxed text-brand-100 sm:text-lg lg:text-xl" style={{ ["--delay" as string]: "150ms" }}>
              A community for curious minds, future economists and changemakers. Connect with people, ideas and opportunities that take economics beyond the lecture room.
            </p>
            <div className="animate-rise mt-9 flex flex-wrap items-center gap-3" style={{ ["--delay" as string]: "220ms" }}>
              <AButton href="/membership" variant="glow" size="lg" className="min-h-14 px-7 text-ink">
                Become a member <ArrowUpRight aria-hidden className="size-4" />
              </AButton>
              <AButton href="/events" variant="dark" size="lg" className="min-h-14 border border-white/20 bg-brand-950/35 px-7 backdrop-blur-md">
                Explore events <CalendarDays aria-hidden className="size-4" />
              </AButton>
            </div>
            <div className="animate-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-100" style={{ ["--delay" as string]: "290ms" }}>
              <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-400" /> Learn together</span>
              <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-400" /> Lead with purpose</span>
              <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-400" /> Create real impact</span>
            </div>
            <AffiliationChip className="animate-rise mt-7" />
          </div>
        </Container>
        <div className="pointer-events-none absolute bottom-7 right-6 hidden rounded-full border border-white/20 bg-brand-950/45 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md sm:block lg:bottom-9 lg:right-10">
          MKUESA · Curiosity in action
        </div>
      </section>

      {/* Quick pathways */}
      <section aria-label="Explore MKUESA" className="relative z-10 -mt-7 pb-8 sm:-mt-10 sm:pb-12">
        <Container>
          <ul className="grid overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_22px_55px_-35px_rgba(34,1,49,0.45)] sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map(({ icon: Icon, title, text, href, number }, index) => (
              <li key={href} className={index ? "border-t border-brand-100 sm:border-l sm:border-t-0 lg:border-l" : ""}>
                <Link href={href} className="group flex h-full items-center gap-4 p-5 transition-colors hover:bg-brand-50/70 sm:p-6">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-800 group-hover:text-white"><Icon aria-hidden className="size-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[0.65rem] font-bold tracking-[0.16em] text-accent-700">{number}</span><span className="mt-0.5 block font-display text-xl font-semibold leading-tight text-brand-950">{title}</span><span className="mt-1 block text-xs text-muted sm:text-sm">{text}</span></span>
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-brand-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand-800" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <AffiliationBand />

      {/* Mission / vision */}
      <Section eyebrow="Who we are" title="A community built for curious minds" description="We bring economics students closer to the ideas, people and experiences that make learning matter." className="!pb-16 sm:!pb-24">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="relative isolate overflow-hidden rounded-[1.8rem] bg-brand-950 p-7 text-white sm:p-10 lg:p-12">
            <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
            <div aria-hidden className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-brand-600/30 blur-3xl" />
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-400"><span className="h-px w-7 bg-accent-500" /> Our mission</p>
            <p className="mt-7 max-w-3xl font-display text-2xl leading-snug text-white sm:text-3xl lg:text-[2.6rem]">{association.mission}</p>
            <div className="mt-9 flex items-center gap-3 text-sm font-semibold text-brand-100"><span className="flex size-10 items-center justify-center rounded-full bg-white/10"><GraduationCap className="size-5 text-accent-400" /></span> Learning beyond the lecture room</div>
          </article>
          <article className="flex flex-col justify-between rounded-[1.8rem] border border-brand-100 bg-white p-7 shadow-[0_20px_50px_-40px_rgba(34,1,49,0.5)] sm:p-10">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-700"><span className="h-px w-7 bg-accent-500" /> Our vision</p>
              <h3 className="mt-6 font-display text-3xl font-semibold leading-tight text-brand-950 sm:text-4xl">A think tank for tomorrow&apos;s problem-solvers.</h3>
              <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{association.vision}</p>
            </div>
            <Link href="/about" className="mt-8 inline-flex w-fit items-center gap-2 border-b border-accent-500 pb-1 text-sm font-bold text-brand-800 transition-colors hover:text-accent-700">Discover the association <ArrowRight className="size-4" /></Link>
          </article>
        </div>
      </Section>

      {/* Pillars */}
      <Section tone="paper" eyebrow="What you can do here" title="Make your economics degree go further" description="A connected student experience that helps you build knowledge, confidence and relationships. ">
        <ul className="grid gap-5 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text, href, cta }, index) => (
            <li key={title} className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-brand-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_55px_-35px_rgba(34,1,49,0.45)]">
              <div aria-hidden className={`relative flex h-44 items-center justify-center overflow-hidden ${index === 0 ? "bg-gradient-to-br from-brand-950 via-brand-800 to-violet-500" : index === 1 ? "bg-gradient-to-br from-[#321044] via-[#6d2990] to-[#e26716]" : "bg-gradient-to-br from-[#1e3445] via-brand-800 to-[#a64cc5]"}`}>
                <span className="absolute -right-8 -top-12 size-48 rounded-full border border-white/15" />
                <span className="absolute -bottom-20 -left-8 size-56 rounded-full border border-white/15" />
                <span className="absolute right-7 top-5 font-display text-6xl font-semibold text-white/15">0{index + 1}</span>
                <span className="relative flex size-20 items-center justify-center rounded-[1.7rem] border border-white/25 bg-white/10 text-white shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"><Icon aria-hidden className="size-10" /></span>
                <span className="absolute bottom-4 left-6 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white/75">{index === 0 ? "Learn together" : index === 1 ? "Understand the world" : "Grow your network"}</span>
              </div>
              <div className="flex flex-1 flex-col p-7 sm:p-8">
              <h3 className="font-display text-2xl font-semibold text-brand-950">{title}</h3>
              <p className="relative mt-3 flex-1 leading-relaxed text-muted">{text}</p>
              <Link href={href} className="relative mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-800">{cta}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Events */}
      <Section eyebrow="On the calendar" title="Meet us where ideas happen" description="Join conversations, workshops and experiences that bring economics to life.">
        <div className="grid gap-4 lg:grid-cols-3">
          {upcoming.map((event) => {
            const { day, month } = dateParts(event.startsAt);
            return (
              <article key={event.slug} className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-[1.5rem] border border-brand-100 bg-white p-6 shadow-[0_18px_45px_-38px_rgba(34,1,49,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-[4.3rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-950 text-white"><span className="font-display text-3xl leading-none">{day}</span><span className="mt-1 text-[0.65rem] font-bold uppercase tracking-wider text-accent-400">{month}</span></span>
                  <span className="rounded-full bg-accent-50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-accent-800">Illustrative event</span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold leading-tight text-brand-950"><Link href={`/events/${event.slug}`} className="after:absolute after:inset-0">{event.title}</Link></h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{event.summary}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted"><span>{formatEventDate(event.startsAt)}</span><span className="inline-flex items-center gap-1 font-semibold text-brand-800">Details <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></div>
              </article>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center"><AButton href="/events" variant="soft">View all events <ArrowRight className="size-4" /></AButton></div>
      </Section>

      {/* Values */}
      <Section tone="dark" eyebrow="What guides us" title="The values behind our community" description="The standards we bring to our learning, our leadership and the way we work together.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {association.values.map((value, index) => (
            <li key={value} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition-colors hover:border-accent-400/50 hover:bg-white/[0.08] sm:p-7">
              <span className="font-display text-sm text-accent-400">0{index + 1}</span>
              <p className="mt-8 font-display text-2xl font-semibold text-white sm:text-3xl">{value}</p>
              <span aria-hidden className="mt-5 block h-1 w-8 rounded-full bg-accent-500 transition-all duration-300 group-hover:w-14" />
            </li>
          ))}
        </ul>
      </Section>

      {/* Membership */}
      <Section eyebrow="Get involved" title="Your place in MKUESA starts here" description="Joining is straightforward. Create an account, apply and become part of the community.">
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="group relative overflow-hidden rounded-[1.5rem] border border-brand-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-34px_rgba(34,1,49,0.5)]">
              <div aria-hidden className={`relative flex h-36 items-center justify-center overflow-hidden ${index === 0 ? "bg-gradient-to-br from-brand-950 to-brand-600" : index === 1 ? "bg-gradient-to-br from-[#4a175f] to-[#d36a22]" : "bg-gradient-to-br from-[#273b4e] to-[#78419b]"}`}>
                <span className="absolute -right-7 -top-12 size-40 rounded-full border border-white/15" />
                <span className="absolute -bottom-20 -left-8 size-48 rounded-full border border-white/15" />
                <span className="absolute right-5 top-3 font-display text-6xl font-semibold text-white/15">0{index + 1}</span>
                <span className="relative flex size-16 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white shadow-xl backdrop-blur-sm transition-transform duration-500 group-hover:scale-110"><Icon className="size-8" /></span>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="font-display text-2xl font-semibold text-brand-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3"><AButton href="/register" variant="solid">Create an account <ArrowRight className="size-4" /></AButton><AButton href="/membership" variant="soft">Membership details</AButton></div>
      </Section>

      {/* Announcements and learning */}
      <Section tone="paper" eyebrow="Stay in the loop" title="The latest from the community">
        <div className="grid gap-5 md:grid-cols-3">
          {sampleAnnouncements.map((item) => <div key={item.slug}><ContentCard label="Announcement" title={item.title} summary={item.summary} sample /></div>)}
        </div>
        <div className="mt-14 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-700">Keep learning</p><h3 className="font-display text-3xl font-semibold text-brand-950 sm:text-4xl">Ideas worth exploring.</h3></div><Link href="/learning-hub" className="inline-flex items-center gap-2 text-sm font-bold text-brand-800">Open the Learning Hub <ArrowUpRight className="size-4" /></Link></div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {featured.map((resource) => <div key={resource.slug}><ContentCard label="Learning resource" title={resource.title} summary={resource.summary} sample /></div>)}
        </div>
      </Section>

      {/* Alumni callout */}
      <section className="bg-ivory py-16 sm:py-24">
        <Container>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-cta-glow p-7 text-white sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:p-14">
            <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
            <div aria-hidden className="absolute -right-24 -top-28 -z-10 size-96 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-400"><Handshake className="size-4" /> For MKU economics alumni</p>
              <h2 className="mt-4 text-balance font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">Your experience can open someone else&apos;s next door.</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">Stay connected, share opportunities and help the next generation of economists find their footing.</p>
            </div>
            <AButton href="/alumni-network" variant="glow" size="lg" className="mt-8 shrink-0 lg:mt-0">Explore the alumni network <ArrowRight className="size-4" /></AButton>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="border-t border-brand-100 bg-white py-14 sm:py-20">
        <Container className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div className="max-w-3xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-700">The next chapter starts with you</p><h2 className="font-display text-3xl font-semibold leading-tight text-brand-950 sm:text-4xl lg:text-5xl">Bring your questions. Find your people. Make an impact.</h2><p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">Join a community that believes economics is more powerful when we learn and build together.</p></div>
          <div className="flex shrink-0 flex-wrap gap-3"><AButton href="/membership" variant="solid" size="lg">Join MKUESA <ArrowRight className="size-4" /></AButton><AButton href="/contact" variant="soft" size="lg"><Mail className="size-4" /> Contact us</AButton></div>
        </Container>
      </section>
    </>
  );
}
