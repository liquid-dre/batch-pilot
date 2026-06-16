"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartDatum {
  day: number;
  value?: number;
  ross?: number;
  band?: number;
}

interface HistoryChartProps {
  data: ChartDatum[];
  /** Name shown for the primary (actual) series. */
  valueName: string;
  unit: string;
  decimals: number;
  showRoss?: boolean;
  showBand?: boolean;
}

// Colours come from CSS tokens via var() (SVG stroke accepts them), so the
// chart re-themes with globals.css and never hardcodes a hex.
const INK = "var(--ink)";
const MUTED = "var(--muted)";
const axisTick = { fill: MUTED, fontSize: 12, fontFamily: "var(--font-mono)" };

function fmt(n: number, unit: string, decimals: number): string {
  const v = n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return unit ? `${v} ${unit}` : v;
}

interface TipItem {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
  decimals,
}: {
  active?: boolean;
  payload?: TipItem[];
  label?: number | string;
  unit: string;
  decimals: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-[var(--radius-control)] border border-divider bg-surface px-3 py-2 shadow-card">
      <p className="text-label font-semibold text-ink">Day {label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2 text-[0.8125rem]">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto font-mono tabular-nums text-ink">
              {typeof p.value === "number" ? fmt(p.value, unit, decimals) : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistoryChart({ data, valueName, unit, decimals, showRoss, showBand }: HistoryChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--divider)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={axisTick}
            stroke="var(--border)"
            tickLine={false}
            tickMargin={8}
            label={{ value: "day of cycle", position: "insideBottom", offset: -2, fill: MUTED, fontSize: 11 }}
            height={40}
          />
          <YAxis tick={axisTick} stroke="var(--border)" tickLine={false} width={48} />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => {
              const { active, payload, label } = props as unknown as { active?: boolean; payload?: TipItem[]; label?: number };
              return <ChartTooltip active={active} payload={payload} label={label} unit={unit} decimals={decimals} />;
            }}
          />
          {showBand ? (
            <Line type="monotone" dataKey="band" name="Contractor band" stroke="var(--status-bad)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          ) : null}
          {showRoss ? (
            <Line type="monotone" dataKey="ross" name="Ross 308" stroke="var(--hint)" strokeWidth={1.75} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
          ) : null}
          <Line
            type="monotone"
            dataKey="value"
            name={valueName}
            stroke="var(--brand-700)"
            strokeWidth={2.25}
            dot={showRoss ? { r: 3, fill: "var(--brand-700)", stroke: INK, strokeWidth: 0 } : false}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
