/** Rounds a maximum up to a "nice" axis limit: 1, 2, 5 or 10 times a power of ten. Never below 1. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11" -> "Nov 26". Anything else is returned unchanged. */
export function monthLabel(ym: string): string {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1].slice(2)}` : ym;
}

/** Share of `part` in `total` as a whole percentage; 0 when there is nothing to divide. */
export const percent = (part: number, total: number): number => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Axis ticks from 0 to max in `count` equal steps. */
export function ticks(max: number, count = 4): number[] {
  const m = niceMax(max);
  return Array.from({ length: count + 1 }, (_, i) => (m / count) * i);
}
