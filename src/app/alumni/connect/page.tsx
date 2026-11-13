import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AlumniHero, Chip, Panel, VerifiedBadge } from "@/components/alumni/ui";
import { ConnectTabs } from "@/components/alumni/connect-tabs";
import { PostForm } from "@/components/alumni/connect-forms";
import { Notice } from "@/components/ui/notice";
import { getDirectory } from "@/lib/alumni/connect";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import { connectTopics } from "@/lib/validation/alumni";

export const metadata: Metadata = { title: "Alumni Connect", robots: { index: false, follow: false } };

type Post = { id: string; title: string; body: string; topic: string; created_at: string; author_id: string; replies: { count: number }[] };

export default async function ConnectPage() {
  const profile = await requireProfile("/alumni/connect");
  const alumnus = await getAlumniProfile(profile.id);
  if (alumnus?.status !== "approved") {
    return (
      <>
        <AlumniHero eyebrow="Alumni Connect" title="Where MKU economists meet" description="Share ideas, ask questions and meet fellow alumni." />
        <Notice tone="pending">Alumni Connect opens once the committee has verified your alumni profile.</Notice>
      </>
    );
  }
  const [{ data }, people] = await Promise.all([
    (await createClient()).from("connect_posts").select("id, title, body, topic, created_at, author_id, replies:connect_replies(count)").order("created_at", { ascending: false }).limit(50),
    getDirectory(),
  ]);
  const byId = new Map(people.map((p) => [p.id, p]));
  const posts = (data ?? []) as unknown as Post[];

  return (
    <>
      <AlumniHero eyebrow="Alumni Connect" title="Where MKU economists meet" description="Share ideas, ask questions and meet fellow alumni across industries." />
      <ConnectTabs active="discussions" />
      <div className="space-y-8">
        <Panel>
          <h2 className="mb-5 text-xl text-brand-900">Start a conversation</h2>
          <PostForm />
        </Panel>
        {posts.length === 0 ? (
          <p className="text-muted">No posts yet. Be the first to share an idea.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((p) => {
              const a = byId.get(p.author_id);
              return (
                <li key={p.id}>
                  <Link href={`/alumni/connect/${p.id}`} className="group block rounded-3xl bg-paper p-6 ring-1 ring-brand-100 shadow-[0_24px_48px_-32px_rgb(34_1_49/0.35)] transition hover:-translate-y-0.5 hover:ring-brand-300 sm:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>{connectTopics.find((t) => t.value === p.topic)?.label ?? p.topic}</Chip>
                      <span className="text-sm text-muted">{formatDay(p.created_at)}</span>
                    </div>
                    <h3 className="mt-3 text-2xl text-brand-900 group-hover:underline group-hover:decoration-accent-500 group-hover:decoration-2 group-hover:underline-offset-4">{p.title}</h3>
                    <p className="mt-2 line-clamp-2 text-muted">{p.body}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-ink">
                        {a?.full_name ?? "Alumnus"} {a && <span className="font-normal text-muted">· Class of {a.graduation_year}</span>}
                        {a?.is_verified && <VerifiedBadge />}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-muted"><MessageCircle aria-hidden className="size-4" /> {p.replies?.[0]?.count ?? 0}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
