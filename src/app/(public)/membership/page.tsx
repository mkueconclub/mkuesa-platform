import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, Briefcase, CalendarDays, GraduationCap, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "Membership" };

const benefits = [
  { icon: GraduationCap, title: "Connect with faculty", text: "Come closer to the faculty of economics." },
  { icon: Briefcase, title: "Working opportunities", text: "Hear first about internships, scholarships and careers." },
  { icon: BookOpen, title: "Member resources", text: "Access learning materials reserved for members." },
  { icon: CalendarDays, title: "Events and competitions", text: "Register for association events and competitions." },
  { icon: Lightbulb, title: "Research and ideas", text: "Contribute to the association's think-tank work." },
  { icon: Award, title: "Certificates", text: "Receive certificates for participation where applicable." },
];

const steps = [
  { title: "Create an account", text: "Register with your details and accept the privacy notice." },
  { title: "Submit your application", text: "Apply for membership for the current academic year." },
  { title: "Executive review", text: "The membership team reviews and approves applications." },
];

export default function MembershipPage() {
  return (
    <>
      <PageHeader eyebrow="Membership" title="Join MKUESA" description="Be part of a community of economics students taking learning beyond the lecture room." />

      <Section tone="paper" eyebrow="Benefits" title="Why join">
        <Notice tone="pending" title="Draft for confirmation" className="mb-8">
          These benefits are drafted from the association&rsquo;s mission and planned platform features. The executive committee will confirm the final list.
        </Notice>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Card className="flex h-full flex-col gap-3">
                <Icon aria-hidden className="size-7 text-brand-600" />
                <h3 className="text-xl text-brand-900">{title}</h3>
                <p className="text-muted">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Eligibility" title="Requirements">
        <Notice tone="pending" title="To be supplied">
          Membership requirements, eligibility and any fees will be added once confirmed by the executive committee.
        </Notice>
      </Section>

      <Section tone="paper" eyebrow="How it works" title="Register in three steps">
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full">
                <span className="font-display text-3xl text-accent-700">{i + 1}</span>
                <h3 className="mt-2 text-xl text-brand-900">{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href="/register" size="lg">
            Join us <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Member login
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
