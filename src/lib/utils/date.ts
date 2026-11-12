const TZ = "Africa/Nairobi";

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeStyle: "short", timeZone: TZ }).format(new Date(iso));
}

export function dateParts(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("en-KE", { day: "numeric", timeZone: TZ }).format(d),
    month: new Intl.DateTimeFormat("en-KE", { month: "short", timeZone: TZ }).format(d),
  };
}

// ---- Admin form helpers. Kenya has no daylight saving, so Nairobi is a fixed UTC+3. ----
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

/** "2026-11-20T14:00" typed in a datetime-local box (Nairobi time) -> ISO string in UTC. Returns null if invalid. */
export function fromNairobiInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO timestamp -> value for a datetime-local box, in Nairobi time. */
export function toNairobiInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + NAIROBI_OFFSET_MS).toISOString().slice(0, 16);
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: TZ }).format(new Date(iso));
}
