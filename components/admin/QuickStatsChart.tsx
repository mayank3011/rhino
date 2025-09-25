"use client";

import React from "react";
import useSWR from "swr";

// ---- Types ----
export interface StatPoint {
  date: string; // ISO date (day resolution)
  count: number;
}

interface StatsResponse {
  points: StatPoint[];
}

interface Props {
  days?: number; // default 30
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export default function QuickStatsChart({ days = 30 }: Props) {
  const { data, error, isLoading } = useSWR<StatsResponse>(
    `/api/admin/registrations/stats?days=${days}`,
    fetcher<StatsResponse>
  );

  // Sizes
  const width = 440;
  const height = 120;
  const padding = 12;

  const points = data?.points ?? [];

  // Compute scales
  const maxY = points.reduce<number>((m, p) => (p.count > m ? p.count : m), 0);
  const yMax = Math.max(maxY, 1);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const pathD = points
    .map((p, i) => {
      const x = padding + i * stepX;
      const y = padding + innerH - (p.count / yMax) * innerH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const total = points.reduce<number>((sum, p) => sum + p.count, 0);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs text-slate-500">Registrations (last {days}d)</div>
          <div className="text-2xl font-semibold text-slate-900">{total}</div>
        </div>
        <div className="text-xs text-slate-500">
          {isLoading ? "Loading…" : error ? "Failed to load" : `${points.length} pts`}
        </div>
      </div>

      <div className="mt-3">
        <svg width={width} height={height} role="img" aria-label="Registrations sparkline">
          {/* Axis baseline */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          {/* Area fill */}
          {points.length > 0 && (
            <path
              d={
                pathD +
                ` L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`
              }
              fill="rgba(16, 185, 129, 0.15)" // emerald-500 @ ~15%
              stroke="none"
            />
          )}
          {/* Line */}
          {points.length > 0 && (
            <path d={pathD} fill="none" stroke="#059669" strokeWidth={2} /> // emerald-600
          )}
          {/* Last point */}
          {points.length > 0 && (
            <circle
              cx={padding + (points.length - 1) * stepX}
              cy={
                padding +
                innerH -
                ((points[points.length - 1]?.count ?? 0) / yMax) * innerH
              }
              r={3.5}
              fill="#065f46" // emerald-800
            />
          )}
        </svg>
      </div>
    </div>
  );
}
