import { monthLabel, niceMax, ticks } from "@/lib/charts/scale";

/** `fill` colours the bars, `swatch` the legend dot. Both are written out in full so Tailwind can find them. */
export type ChartSeries = { name: string; values: number[]; fill: string; swatch: string };

const W = 640;
const H = 280;
const M = { top: 12, right: 8, bottom: 40, left: 36 };

/**
 * Vertical grouped bar chart drawn as plain SVG (no charting library to maintain).
 * Screen readers get a data table instead of the drawing.
 */
export function BarChart({ title, labels, series, formatLabel = monthLabel }: { title: string; labels: string[]; series: ChartSeries[]; formatLabel?: (l: string) => string }) {
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const group = plotW / Math.max(1, labels.length);
  const barW = Math.min(28, (group * 0.72) / Math.max(1, series.length));
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const showEvery = labels.length > 8 ? 2 : 1;

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="font-medium text-ink">{title}</span>
        {series.length > 1 &&
          series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 text-muted">
              <span aria-hidden className={`inline-block size-3 rounded-sm ${s.swatch}`} />
              {s.name}
            </span>
          ))}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
        {ticks(max).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className="stroke-brand-100" strokeWidth={1} />
            <text x={M.left - 6} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const gx = M.left + group * i + (group - barW * series.length) / 2;
          return (
            <g key={l}>
              {series.map((s, j) => {
                const v = s.values[i] ?? 0;
                return (
                  <rect key={s.name} x={gx + barW * j} y={y(v)} width={barW - 2} height={Math.max(0, M.top + plotH - y(v))} rx={2} className={s.fill}>
                    <title>{`${formatLabel(l)}: ${s.name} ${v}`}</title>
                  </rect>
                );
              })}
              {i % showEvery === 0 && (
                <text x={M.left + group * i + group / 2} y={H - M.bottom + 18} textAnchor="middle" className="fill-muted text-[11px]">{formatLabel(l)}</text>
              )}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th scope="col">Period</th>{series.map((s) => <th key={s.name} scope="col">{s.name}</th>)}</tr></thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l}><th scope="row">{formatLabel(l)}</th>{series.map((s) => <td key={s.name}>{s.values[i] ?? 0}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export type BarRow = { label: string; sublabel?: string; value: number; secondary?: number; note?: string };

/** Horizontal bars as plain HTML, for rows with long labels. `secondary` is drawn on top of `value` (for example attended out of signed up). */
export function BarList({ rows, max, valueLabel = (r: BarRow) => String(r.value) }: { rows: BarRow[]; max?: number; valueLabel?: (r: BarRow) => string }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label + (r.sublabel ?? "")}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 font-medium text-ink">{r.label}{r.sublabel && <span className="ml-2 font-normal text-muted">{r.sublabel}</span>}</span>
            <span className="shrink-0 text-muted">{valueLabel(r)}</span>
          </div>
          <div aria-hidden className="mt-1.5 h-3 overflow-hidden rounded-full bg-brand-50">
            <div className="relative h-3 rounded-full bg-brand-200" style={{ width: `${Math.min(100, (r.value / top) * 100)}%` }}>
              {r.secondary !== undefined && r.value > 0 && <div className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${Math.min(100, (r.secondary / r.value) * 100)}%` }} />}
            </div>
          </div>
          {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
        </li>
      ))}
    </ul>
  );
}
