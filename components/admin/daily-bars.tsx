'use client';

import { useState } from 'react';

/** Validated against the white surface (dataviz validator: lightness, chroma, ≥3:1 contrast all pass). */
const MARK = '#0097a7';

const label = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/**
 * One series of daily counts as thin bars (4px rounded tops on the baseline, 2px gaps),
 * with a hover tooltip, a labelled peak, and a table view for screen readers / exact values.
 */
export function DailyBars({ title, data }: { title: string; data: { day: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));
  const peak = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0);

  const W = 300;
  const H = 96;
  const top = 14; // room for the peak label
  const slot = W / data.length;
  const barW = Math.max(2, slot - 2); // 2px surface gap between bars

  return (
    <figure className="space-y-2">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">
          <span className="text-base font-semibold tabular-nums text-foreground">{total}</span> in {data.length} days
        </span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full overflow-visible" role="img" aria-label={`${title}: ${total} in the last ${data.length} days`}>
          <line x1={0} x2={W} y1={H} y2={H} stroke="currentColor" className="text-border" strokeWidth={1} />
          {data.map((d, i) => {
            const h = d.count ? Math.max(3, ((H - top) * d.count) / max) : 0;
            const x = i * slot + 1;
            const r = Math.min(2, barW / 2, h);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* Hit target: the full column, larger than the mark. */}
                <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${x},${H} v${-(h - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${h - r} z`}
                    fill={MARK}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {i === peak && d.count > 0 && (
                  <text x={x + barW / 2} y={H - h - 4} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                    {d.count}
                  </text>
                )}
              </g>
            );
          })}
          {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
            <text key={i} x={i * slot + slot / 2} y={H + 12} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="fill-muted-foreground text-[9px]">
              {label(data[i].day)}
            </text>
          ))}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <span className="text-muted-foreground">{label(data[hover].day)}</span>{' '}
            <span className="font-semibold tabular-nums">{data[hover].count}</span>
          </div>
        )}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Table view</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted-foreground"><th className="font-normal">Day</th><th className="text-right font-normal">Count</th></tr>
          </thead>
          <tbody>
            {data.filter((d) => d.count > 0).map((d) => (
              <tr key={d.day}><td>{label(d.day)}</td><td className="text-right tabular-nums">{d.count}</td></tr>
            ))}
            {total === 0 && <tr><td colSpan={2} className="text-muted-foreground">No activity in this period.</td></tr>}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
