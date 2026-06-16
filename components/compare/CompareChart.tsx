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

export interface CompareSeries {
  id: string;
  name: string;
  color: string;
  emphasis?: boolean;
  points: { day: number; value?: number }[];
}

interface CompareChartProps {
  series: CompareSeries[];
  /** Optional Ross 308 reference overlay. */
  ross?: { day: number; value: number }[];
  unit: string;
  decimals: number;
}

const MUTED = "var(--muted)";
const axisTick = { fill: MUTED, fontSize: 12, fontFamily: "var(--font-mono)" };

function fmt(n: number, unit: string, decimals: number): string {
  const v = n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return unit ? `${v} ${unit}` : v;
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

export function CompareChart({ series, ross, unit, decimals }: CompareChartProps) {
  // Merge all series into a single day-indexed dataset for Recharts.
  const days = new Set<number>();
  series.forEach((s) => s.points.forEach((p) => days.add(p.day)));
  ross?.forEach((r) => days.add(r.day));
  const sortedDays = [...days].sort((a, b) => a - b);

  const valueMaps = series.map((s) => new Map(s.points.map((p) => [p.day, p.value])));
  const rossMap = ross ? new Map(ross.map((r) => [r.day, r.value])) : null;

  const data = sortedDays.map((day) => {
    const row: Record<string, number> = { day };
    series.forEach((s, i) => {
      const v = valueMaps[i].get(day);
      if (v != null) row[s.id] = v;
    });
    if (rossMap) {
      const rv = rossMap.get(day);
      if (rv != null) row.ross = rv;
    }
    return row;
  });

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--divider)" vertical={false} />
          <XAxis
            dataKey="day"
            type="number"
            domain={["dataMin", "dataMax"]}
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
          {rossMap ? (
            <Line type="monotone" dataKey="ross" name="Ross 308" stroke="var(--hint)" strokeWidth={1.75} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
          ) : null}
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.emphasis ? 2.75 : 1.75}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
