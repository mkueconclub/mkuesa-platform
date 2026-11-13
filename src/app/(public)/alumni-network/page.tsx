import type { Metadata } from "next";
import { ArrowRight, Award, BookOpen, Briefcase, CalendarDays, GraduationCap, HeartHandshake, Lightbulb } from "lucide-react";
import { AButton } from "@/components/alumni/ui";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Alumni Network" };

const steps = [
  { title: "Create an account", text: "Register with your email address and confirm it, as every user does." },
  { title: "Build your alumni profile", text: "Sign in to the Alumni portal and add your graduation year, organisation and position." },
  { title: "Get verified", text: "The committee checks your profile and opens the portal for you." },
  { title: "Open doors", text: "Share opportunities and offer mentorship. Approved posts go live on the Opportunities page." },
];
const gives = [
  { icon: Briefcase, label: "Industrial attachments" },
  { icon: CalendarDays, label: "Internships" },
  { icon: Lightbulb, label: "Career opportunities" },
  { icon: GraduationCap, label: "Graduate trainee programmes" },
  { icon: Award, label: "Scholarships" },
  { icon: HeartHandshake, label: "Mentorship" },
  { icon: BookOpen, label: "Research collaboration" },
];

export default function AlumniNetworkPage() {
  return (
    <>
      <section className="bg-hero-glow relative isolate overflow-hidden text-ivory">
        <div aria-hidden className="bg-grid-light absolute inset-0 -z-10" />
        <Container className="py-20 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent-400">
            <span aria-hidden className="size-1.5 rounded-full bg-accent-400" /> MKU Economics Alumni
          </p>
          <h1 className="mt-6 max-w-3xl text-balance text-5xl text-white sm:text-6xl lg:text-7xl">Open the door behind you<span className="text-accent-400">.</span></h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-brand-100 sm:text-xl">You were once where our students are. Share an attachment, a scholarship or an hour of mentorship, and help the next economists get started.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <AButton href="/register" variant="glow" size="lg">Create an account <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" /></AButton>
            <AButton href="/login?next=%2Falumni" variant="dark" size="lg">Alumni sign in</AButton>
          </div>
        </Container>
      </section>

      <section className="bg-ivory py-16 sm:py-24">
        <Container>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-700">How it works</p>
          <h2 className="mt-3 text-3xl text-brand-900 sm:text-5xl">Join in four steps</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative overflow-hidden rounded-3xl bg-paper p-7 ring-1 ring-brand-100 shadow-[0_24px_48px_-32px_rgb(34_1_49/0.35)]">
                <span aria-hidden className="absolute -right-2 -top-4 font-display text-8xl font-semibold text-brand-100">{i + 1}</span>
                <h3 className="relative mt-10 text-xl text-brand-900">{s.title}</h3>
                <p className="relative mt-2 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-paper py-16 sm:py-24">
        <Container>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-700">What you can share</p>
          <h2 className="mt-3 text-3xl text-brand-900 sm:text-5xl">Seven ways to give back</h2>
          <ul className="mt-10 flex flex-wrap gap-3">
            {gives.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2.5 rounded-full bg-brand-50 px-5 py-3 font-semibold text-brand-900 ring-1 ring-inset ring-brand-200">
                <Icon aria-hidden className="size-5 text-brand-700" /> {label}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-cta-glow text-white">
        <Container className="flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
          <h2 className="max-w-2xl text-balance text-3xl sm:text-5xl">Ready to mentor the next generation of economists?</h2>
          <AButton href="/register" variant="glow" size="lg" className="shrink-0">Join the Alumni Network</AButton>
        </Container>
      </section>
    </>
  );
}
