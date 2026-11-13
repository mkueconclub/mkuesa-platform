import type { Metadata } from "next";
import { AlumniCard } from "@/components/alumni/alumni-card";
import { FollowButton } from "@/components/alumni/follow-button";
import { PageTitle } from "@/components/dashboard/page-title";
import { Notice } from "@/components/ui/notice";
import { getDirectory } from "@/lib/alumni/connect";
import { requireProfile } from "@/lib/auth/session";
import { getMemberships, hasActiveMembership } from "@/lib/member/queries";
import { verifiedFollowerThreshold } from "@/lib/validation/alumni";

export const metadata: Metadata = { title: "Alumni", robots: { index: false, follow: false } };

export default async function MemberAlumniPage() {
  const profile = await requireProfile("/dashboard/alumni");
  const active = hasActiveMembership(await getMemberships(profile.id));
  const people = active ? await getDirectory() : [];
  return (
    <>
      <PageTitle eyebrow="Alumni" title="Follow MKU alumni" description={`Follow graduates whose careers inspire you. An alumnus followed by more than ${verifiedFollowerThreshold} approved members earns a Verified badge.`} />
      {!active ? (
        <Notice tone="pending">Following alumni is open to approved members. Check your membership status first.</Notice>
      ) : people.length === 0 ? (
        <p className="text-muted">No alumni have joined the network yet.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {people.map((a) => <li key={a.id}><AlumniCard a={a} action={<FollowButton alumnusId={a.id} following={a.followed_by_me} />} /></li>)}
        </ul>
      )}
    </>
  );
}
