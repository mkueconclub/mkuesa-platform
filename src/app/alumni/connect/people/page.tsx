import type { Metadata } from "next";
import { AlumniCard } from "@/components/alumni/alumni-card";
import { ConnectTabs } from "@/components/alumni/connect-tabs";
import { AlumniHero } from "@/components/alumni/ui";
import { Notice } from "@/components/ui/notice";
import { getDirectory } from "@/lib/alumni/connect";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Meet alumni", robots: { index: false, follow: false } };

export default async function PeoplePage() {
  const profile = await requireProfile("/alumni/connect/people");
  const approved = (await getAlumniProfile(profile.id))?.status === "approved";
  const people = approved ? await getDirectory() : [];
  return (
    <>
      <AlumniHero eyebrow="Alumni Connect" title="Meet fellow alumni" description="Find classmates and graduates from other years, and see who is open to mentoring." />
      <ConnectTabs active="people" />
      {!approved ? (
        <Notice tone="pending">The alumni directory opens once the committee has verified your alumni profile.</Notice>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {people.map((a) => <li key={a.id}><AlumniCard a={a} /></li>)}
        </ul>
      )}
    </>
  );
}
