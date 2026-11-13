/** Pure helpers for the public pages (no I/O, unit-tested). */

/** One-line summary of longer text: whitespace collapsed, cut at a word boundary. */
export function excerpt(text: string | null | undefined, max = 160): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,;:.\-]+$/, "")}…`;
}

type Timed = { starts_at: string; ends_at: string | null };

/** An event is "upcoming" until it has ended (or, with no end time, until it has started). */
export const hasEnded = (e: Timed, now = new Date()): boolean => new Date(e.ends_at ?? e.starts_at) <= now;

/** Upcoming events soonest first; past events most recent first. */
export function partitionEvents<T extends Timed>(events: readonly T[], now = new Date()): { upcoming: T[]; past: T[] } {
  const upcoming = events.filter((e) => !hasEnded(e, now)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = events.filter((e) => hasEnded(e, now)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return { upcoming, past };
}

/** An opportunity stays listed until its deadline has passed; one with no deadline stays listed. */
export const isOpenOpportunity = (o: { deadline: string | null }, now = new Date()): boolean => o.deadline === null || new Date(o.deadline) >= now;

/** Only ever link to web addresses. The database enforces this too; this keeps a bad row from becoming a javascript: link. */
export const safeWebUrl = (u: string | null | undefined): string | null => (u && /^https?:\/\/\S+$/i.test(u) ? u : null);
