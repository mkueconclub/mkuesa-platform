"use client";

import { useActionState, type ReactNode } from "react";
import { Award, BookOpen, Briefcase, CalendarDays, GraduationCap, HeartHandshake, Lightbulb } from "lucide-react";
import { Status } from "@/components/auth/auth-forms";
import { AButton, Panel } from "@/components/alumni/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAlumniProfileAction, submitAlumniOpportunityAction } from "@/lib/alumni/actions";
import type { FormState } from "@/lib/forms";
import { alumniOpportunityCategories } from "@/lib/validation/alumni";

const initial: FormState = { ok: false, message: "" };
const icons = { attachment: Briefcase, internship: CalendarDays, career: Lightbulb, graduate_trainee: GraduationCap, scholarship: Award, mentorship: HeartHandshake, research_collaboration: BookOpen } as const;
// Rounder, taller fields for the alumni look, without touching the shared inputs.
const fields = "space-y-6 [&_input:not([type=checkbox]):not([type=radio])]:h-12 [&_input:not([type=checkbox]):not([type=radio])]:rounded-xl [&_textarea]:rounded-xl [&_label]:font-semibold";

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Panel>
      <h2 className="flex items-center gap-3 text-xl text-brand-900">
        <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-ink">{n}</span>
        {title}
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 [&>*:only-child]:sm:col-span-2 [&_[data-wide]]:sm:col-span-2">{children}</div>
    </Panel>
  );
}

export function AlumniProfileForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveAlumniProfileAction, initial);
  const v = state.values ?? defaults;
  const e = state.errors;
  return (
    <form action={action} noValidate className={`max-w-3xl ${fields}`}>
      <Step n={1} title="Your career">
        <Input label="Graduation year" name="graduationYear" type="number" min={1990} max={2100} inputMode="numeric" required defaultValue={v.graduationYear} error={e?.graduationYear} />
        <Input label="Current organisation" name="organisation" defaultValue={v.organisation} error={e?.organisation} />
        <div data-wide><Input label="Professional position" name="positionTitle" defaultValue={v.positionTitle} error={e?.positionTitle} /></div>
      </Step>
      <Step n={2} title="About you">
        <div data-wide><Textarea label="Short bio (optional)" name="bio" rows={4} defaultValue={v.bio} error={e?.bio} /></div>
        <div data-wide><Input label="LinkedIn link (optional)" name="linkedinUrl" type="url" defaultValue={v.linkedinUrl} hint="Must start with https://" error={e?.linkedinUrl} /></div>
        <label data-wide className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-200">
          <span>
            <span className="block font-semibold text-brand-900">I am open to mentoring students</span>
            <span className="text-sm text-muted">Shown to the committee when they match mentors.</span>
          </span>
          <input type="checkbox" name="openToMentoring" defaultChecked={v.openToMentoring === "on" || v.openToMentoring === "true"} className="peer sr-only" />
          <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-brand-200 transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2" />
        </label>
      </Step>
      <Status state={state} />
      <AButton type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save profile"}</AButton>
    </form>
  );
}

export function AlumniOpportunityForm() {
  const [state, action, pending] = useActionState(submitAlumniOpportunityAction, initial);
  const v = state.values ?? {};
  const e = state.errors;
  return (
    <form action={action} noValidate className={`max-w-4xl ${fields}`}>
      <Panel>
        <h2 className="flex items-center gap-3 text-xl text-brand-900">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-ink">1</span>
          What are you sharing?
        </h2>
        <fieldset className="mt-6">
          <legend className="sr-only">Opportunity type</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alumniOpportunityCategories.map((c) => {
              const Icon = icons[c.value];
              return (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" name="category" value={c.value} defaultChecked={v.category === c.value} className="peer sr-only" />
                  <span className="flex h-full items-center gap-3 rounded-2xl border border-brand-100 bg-paper p-4 font-semibold text-ink transition hover:-translate-y-0.5 hover:border-brand-300 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:ring-2 peer-checked:ring-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon aria-hidden className="size-5" /></span>
                    {c.label}
                  </span>
                </label>
              );
            })}
          </div>
          {e?.category && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{e.category}</p>}
        </fieldset>
      </Panel>
      <Step n={2} title="The details">
        <div data-wide><Input label="Title" name="title" required defaultValue={v.title} hint="For example: Industrial attachment, Treasury department" error={e?.title} /></div>
        <Input label="Organisation" name="organisation" required defaultValue={v.organisation} error={e?.organisation} />
        <Input label="Eligibility (optional)" name="eligibility" defaultValue={v.eligibility} hint="For example: Economics and Finance students" error={e?.eligibility} />
        <div data-wide><Textarea label="Description" name="description" rows={5} required defaultValue={v.description} error={e?.description} /></div>
      </Step>
      <Step n={3} title="How to apply">
        <Input label="Deadline (optional)" name="deadline" type="date" defaultValue={v.deadline} error={e?.deadline} />
        <Input label="Contact" name="contact" required defaultValue={v.contact} hint="Official email or phone" error={e?.contact} />
        <div data-wide><Input label="Application link (optional)" name="applyUrl" type="url" defaultValue={v.applyUrl} hint="Official application URL, starting with https://" error={e?.applyUrl} /></div>
      </Step>
      <Status state={state} />
      <AButton type="submit" size="lg" disabled={pending}>{pending ? "Submitting…" : "Submit for review"}</AButton>
    </form>
  );
}
