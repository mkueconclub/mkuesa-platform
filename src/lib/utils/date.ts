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
