import type { BenchmarkPoint, StatusLevel } from "@/lib/types";

export interface ActualMarker {
  day: number;
  weightG: number;
  level: StatusLevel;
  label: string;
}

interface BenchmarkChartProps {
  curve: BenchmarkPoint[];
  markers: ActualMarker[];
  killDay: number;
  maxDay?: number;
}

const LEVEL_FILL: Record<StatusLevel, string> = {
  green: "fill-status-good",
  amber: "fill-status-warn",
  red: "fill-status-bad",
};

/**
 * Hand-built SVG line chart (no chart lib, per ROADMAP §4): the Ross 308 weight
 * objective with each house's actual weight plotted against it, plus a kill-date
 * reference line. The gap below the curve is the under-performance story.
 */
export function BenchmarkChart({ curve, markers, killDay, maxDay = 35 }: BenchmarkChartProps) {
  const W = 720;
  const H = 360;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const yMax = 2400;
  const x = (day: number) => padL + (day / maxDay) * plotW;
  const y = (w: number) => padT + (1 - w / yMax) * plotH;

  const pts = curve.filter((p) => p.day <= maxDay);
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.day).toFixed(1)} ${y(p.weightG).toFixed(1)}`).join(" ");

  const yTicks = [0, 600, 1200, 1800, 2400];
  const xTicks = [0, 7, 14, 21, 28, 35].filter((d) => d <= maxDay);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Ross 308 weight curve with actual house weights">
      {/* horizontal gridlines + y labels (grams) */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} className="stroke-divider" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="fill-muted font-mono" fontSize="11">
            {t}
          </text>
        </g>
      ))}

      {/* x labels (day) */}
      {xTicks.map((d) => (
        <text key={d} x={x(d)} y={H - padB + 18} textAnchor="middle" className="fill-muted font-mono" fontSize="11">
          {d}
        </text>
      ))}
      <text x={padL} y={H - 4} className="fill-hint" fontSize="11">
        day
      </text>

      {/* kill-date reference line */}
      <line x1={x(killDay)} y1={padT} x2={x(killDay)} y2={padT + plotH} className="stroke-hint" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={x(killDay)} y={padT + 12} textAnchor="middle" className="fill-hint" fontSize="10">
        kill day {killDay}
      </text>

      {/* Ross 308 objective curve */}
      <path d={linePath} className="stroke-brand-700" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* actual house markers */}
      {markers.map((m) => (
        <g key={m.label}>
          <circle cx={x(m.day)} cy={y(m.weightG)} r="4.5" className={`${LEVEL_FILL[m.level]} stroke-surface`} strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}
