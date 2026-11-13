/** Pure helpers for officer profiles (no server-only code, so they are safe in tests and client components). */

/**
 * Officers shown on the public About page. Visitors ("anon") only ever see entries the Super Administrator has
 * approved and that are current: the database enforces this, not this file.
 * `contact_email` is null until the officer has added it; until then their profile cannot be opened or written to.
 */
export type PublicExecutive = {
  id: string;
  display_name: string;
  position_title: string;
  bio: string | null;
  term_label: string | null;
  display_order: number;
  contact_email: string | null;
};

/** An officer can be written to once approved AND once they have added their email. */
export const canBeContacted = (e: Pick<PublicExecutive, "contact_email">) => Boolean(e.contact_email);

/** Up to two initials for the profile avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
