import type { Metadata } from "next";
import { AlumniProfileForm } from "@/components/alumni/alumni-forms";
import { AlumniHero } from "@/components/alumni/ui";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Alumni profile", robots: { index: false, follow: false } };

export default async function AlumniProfilePage() {
  const profile = await requireProfile("/alumni/profile");
  const a = await getAlumniProfile(profile.id);
  return (
    <>
      <AlumniHero eyebrow="Alumni Network" title="My alumni profile" description="Changes to an approved profile apply straight away. A profile that was not approved goes back to the committee when you save it." />
      <AlumniProfileForm defaults={{ graduationYear: a ? String(a.graduation_year) : "", organisation: a?.organisation ?? "", positionTitle: a?.position_title ?? "", bio: a?.bio ?? "", linkedinUrl: a?.linkedin_url ?? "", openToMentoring: a?.open_to_mentoring ? "on" : "" }} />
    </>
  );
}
