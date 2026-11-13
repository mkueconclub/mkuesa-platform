import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AButton, Chip, Panel, VerifiedBadge } from "@/components/alumni/ui";
import { ReplyForm } from "@/components/alumni/connect-forms";
import { getDirectory } from "@/lib/alumni/connect";
import { deletePostAction } from "@/lib/alumni/connect-actions";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import { connectTopics } from "@/lib/validation/alumni";

export const metadata: Metadata = { title: "Alumni Connect", robots: { index: false, follow: false } };
type Reply = { id: string; body: string; created_at: string; author_id: string };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(`/alumni/connect/${id}`);
  if ((await getAlumniProfile(profile.id))?.status !== "approved") notFound();
  const supabase = await createClient();
  const [{ data: post }, { data: replies }, people] = await Promise.all([
    supabase.from("connect_posts").select("id, title, body, topic, created_at, author_id").eq("id", id).maybeSingle(),
    supabase.from("connect_replies").select("id, body, created_at, author_id").eq("post_id", id).order("created_at"),
    getDirectory(),
  ]);
  if (!post) notFound();
  const byId = new Map(people.map((p) => [p.id, p]));
  const who = (authorId: string) => {
    const a = byId.get(authorId);
    return (
      <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
        {a?.full_name ?? "Alumnus"} {a && <span className="font-normal text-muted">· Class of {a.graduation_year}</span>} {a?.is_verified && <VerifiedBadge />}
      </span>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/alumni/connect" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><ArrowLeft aria-hidden className="size-4" /> All discussions</Link>
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{connectTopics.find((t) => t.value === post.topic)?.label ?? post.topic}</Chip>
          <span className="text-sm text-muted">{formatDay(post.created_at)}</span>
        </div>
        <h1 className="mt-3 text-3xl text-brand-900">{post.title}</h1>
        <div className="mt-2 text-sm">{who(post.author_id)}</div>
        <p className="mt-5 whitespace-pre-line text-lg text-ink">{post.body}</p>
        {post.author_id === profile.id && (
          <form action={deletePostAction} className="mt-6">
            <input type="hidden" name="postId" value={post.id} />
            <AButton type="submit" variant="ghost">Delete my post</AButton>
          </form>
        )}
      </Panel>
      <h2 className="text-2xl text-brand-900">{(replies ?? []).length} {(replies ?? []).length === 1 ? "reply" : "replies"}</h2>
      <ul className="space-y-3">
        {((replies ?? []) as Reply[]).map((r) => (
          <li key={r.id} className="rounded-3xl bg-paper p-5 ring-1 ring-brand-100">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">{who(r.author_id)}<span className="text-muted">{formatDay(r.created_at)}</span></div>
            <p className="mt-2 whitespace-pre-line text-ink">{r.body}</p>
          </li>
        ))}
      </ul>
      <Panel><ReplyForm postId={post.id} /></Panel>
    </div>
  );
}
