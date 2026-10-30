"use client";

import { useState } from "react";
import type { DailyPoint } from "@/lib/analytics/report";

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** One measure per day. Hover or focus a day for its number; the table below holds them all. */
export default function DailyBars({
  title,
  unit,
  points,
  emptyText,
}: {
  title: string;
  unit: string;
  points: DailyPoint[];
  emptyText: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...points.map((p) => p.value), 0);
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const shown = active === null ? null : points[active];
  const unitFor = (value: number) => (value === 1 ? unit.replace(/s$/, "") : unit);

  return (
    <section className="glow-border rounded-xl bg-surface p-5" aria-label={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {shown ? (
            <>
              <strong className="text-foreground">{shown.value.toLocaleString()}</strong> {unitFor(shown.value)}, {dayLabel(shown.day)}
            </>
          ) : (
            <>
              <strong className="text-foreground">{total.toLocaleString()}</strong> {unitFor(total)} in total
            </>
          )}
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-4 flex h-32 items-center justify-center rounded-lg bg-surface-2/40 px-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <>
          <div className="relative mt-4 border-b border-border">
            <span className="absolute right-0 top-0 text-xs text-muted-foreground">{max.toLocaleString()}</span>
            <div className="flex h-32 items-end gap-0.5" onPointerLeave={() => setActive(null)}>
              {points.map((point, index) => (
                <button
                  key={point.day}
                  type="button"
                  aria-label={`${dayLabel(point.day)}: ${point.value} ${unitFor(point.value)}`}
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="flex h-full min-w-0 flex-1 items-end rounded-sm focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span
                    className={`block w-full rounded-t ${active === index ? "bg-foreground" : "bg-accent"}`}
                    style={{ height: point.value > 0 ? `${Math.max((point.value / max) * 100, 3)}%` : 0 }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{dayLabel(points[0].day)}</span>
            <span>{dayLabel(points[points.length - 1].day)}</span>
          </div>
          <details className="mt-3 text-sm text-muted-foreground">
            <summary className="inline-flex min-h-11 cursor-pointer items-center">Show as table</summary>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th scope="col" className="py-1 font-medium">Day</th>
                    <th scope="col" className="py-1 text-right font-medium">{unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.day} className="border-t border-border/60">
                      <td className="py-1">{dayLabel(point.day)}</td>
                      <td className="py-1 text-right text-foreground">{point.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
