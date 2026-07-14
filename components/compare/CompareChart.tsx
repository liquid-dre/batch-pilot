"use client";

import * as Recharts from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

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

  // Config drives the tooltip labels + the per-series colour injected as
  // `--color-<id>` by ChartContainer, so each line references it via var().
  const config: ChartConfig = {
    ...(rossMap ? { ross: { label: "Ross 308", color: "var(--hint)" } } : {}),
    ...Object.fromEntries(series.map((s) => [s.id, { label: s.name, color: s.color }])),
  };

  return (
    <ChartContainer config={config} className="h-[340px]">
      <Recharts.LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <Recharts.CartesianGrid stroke="var(--divider)" vertical={false} />
        <Recharts.XAxis
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
        <Recharts.YAxis tick={axisTick} stroke="var(--border)" tickLine={false} width={48} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              formatter={(v) => (typeof v === "number" ? fmt(v, unit, decimals) : "—")}
            />
          }
          labelFormatter={(d) => `Day ${d}`}
        />
        {rossMap ? (
          <Recharts.Line type="monotone" dataKey="ross" name="Ross 308" stroke="var(--color-ross)" strokeWidth={1.75} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
        ) : null}
        {series.map((s) => (
          <Recharts.Line
            key={s.id}
            type="monotone"
            dataKey={s.id}
            name={s.name}
            stroke={`var(--color-${s.id})`}
            strokeWidth={s.emphasis ? 2.75 : 1.75}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </Recharts.LineChart>
    </ChartContainer>
  );
}
