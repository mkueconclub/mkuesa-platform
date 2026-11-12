/**
 * Cleans a staff search box before it is placed inside a PostgREST filter. Commas, brackets, asterisks, percent signs
 * and the like have meaning inside a filter string, so anything that is not a letter, digit, space or one of @ . - _
 * is dropped. The result is also capped in length.
 */
export function cleanSearchQuery(q: string | undefined | null): string {
  return (q ?? "").replace(/[^\p{L}\p{N}@.\-_ ]/gu, "").trim().slice(0, 60);
}
