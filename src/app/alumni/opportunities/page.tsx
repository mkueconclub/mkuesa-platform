import type { Metadata } from "next";
import { AlumniOpportunityForm } from "@/components/alumni/alumni-forms";
import { AlumniHero } from "@/components/alumni/ui";
import { Notice } from "@/components/ui/notice";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Share an opportunity", robots: { index: false, follow: false } };

export default async function AlumniOpportunityPage() {
  const profile = await requireProfile("/alumni/opportunities");
  const a = await getAlumniProfile(profile.id);
  return (
    <>
      <AlumniHero eyebrow="Alumni Network" title="Share an opportunity" description="Attachments, internships, careers, scholarships, graduate trainee programmes, mentorship and research collaboration. Administrators review every submission before it appears on the Opportunities page." />
      {a?.status === "approved" ? <AlumniOpportunityForm /> : <Notice tone="pending">You can submit opportunities once the committee has verified your alumni profile.</Notice>}
    </>
  );
}
