import type { ReactNode } from "react";
import { ArrowUpRight, Users } from "lucide-react";
import { Avatar, Chip, VerifiedBadge } from "@/components/alumni/ui";
import type { DirectoryEntry } from "@/lib/alumni/connect";

/** One alumnus in a directory. `action` is where a Follow button goes for members. */
export function AlumniCard({ a, action }: { a: DirectoryEntry; action?: ReactNode }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl bg-paper p-6 ring-1 ring-brand-100 shadow-[0_24px_48px_-32px_rgb(34_1_49/0.35)]">
      <div className="flex items-start gap-4">
        <Avatar name={a.full_name} />
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-xl text-brand-900">
            {a.full_name}
            {a.is_verified && <VerifiedBadge />}
          </h3>
          <p className="text-sm text-muted">{a.position_title || "Alumnus"}{a.organisation ? ` · ${a.organisation}` : ""}</p>
        </div>
      </div>
      {a.bio && <p className="line-clamp-3 text-sm text-muted">{a.bio}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Chip>Class of {a.graduation_year}</Chip>
        {a.open_to_mentoring && <Chip tone="live">Open to mentoring</Chip>}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted"><Users aria-hidden className="size-3.5" /> {a.follower_count} followers</span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
        {action}
        {a.linkedin_url && (
          <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            LinkedIn <ArrowUpRight aria-hidden className="size-4" />
          </a>
        )}
      </div>
    </article>
  );
}
