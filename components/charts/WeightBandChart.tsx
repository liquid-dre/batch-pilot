"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightBandData } from "@/lib/view";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const MUTED = "var(--muted)";
const axisTick = { fill: MUTED, fontSize: 12, fontFamily: "var(--font-mono)" };
const BAND_KEYS = new Set(["redBand", "amberBand", "greenBand"]);

interface TipItem {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TipItem[]; label?: number }) {
  if (!active || !payload) return null;
  const rows = payload.filter((p) => !BAND_KEYS.has(String(p.dataKey)));
  if (rows.length === 0) return null;
  return (
    <div className="rounded-[var(--radius-control)] border border-divider bg-surface px-3 py-2 shadow-card">
      <p className="text-label font-semibold text-ink">Day {label}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2 text-[0.8125rem]">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto font-mono tabular-nums text-ink">
              {typeof p.value === "number" ? `${p.value.toLocaleString("en-US")} g` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WeightBandChart({ data }: { data: WeightBandData }) {
  const weightByHouseDay = data.houses.map((h) => new Map(h.points.map((p) => [p.day, p.weightG])));

  const rows = data.ross.map((r, i) => {
    const ross = r.weightG;
    const redTop = data.amberFrac * ross; // 0 → 90% of Ross
    const amberSpan = (data.greenFrac - data.amberFrac) * ross; // 90% → 97%
    const greenSpan = Math.max(0, data.yMax - data.greenFrac * ross); // 97% → top
    const row: Record<string, number> = { day: r.day, ross, redBand: redTop, amberBand: amberSpan, greenBand: greenSpan };
    data.houses.forEach((h, hi) => {
      const w = weightByHouseDay[hi].get(r.day);
      if (w != null) row[h.houseId] = w;
    });
    void i;
    return row;
  });

  return (
    <div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="var(--divider)" vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, data.maxDay]}
              tick={axisTick}
              stroke="var(--border)"
              tickLine={false}
              tickMargin={8}
              label={{ value: "day of cycle", position: "insideBottom", offset: -2, fill: MUTED, fontSize: 11 }}
              height={40}
            />
            <YAxis domain={[0, data.yMax]} tick={axisTick} stroke="var(--border)" tickLine={false} width={48} />
            <Tooltip content={(p) => <ChartTooltip {...(p as unknown as { active?: boolean; payload?: TipItem[]; label?: number })} />} />

            {/* Shaded bands (stacked from 0): red < 90% · amber 90–97% · green ≥97% of Ross */}
            <Area type="monotone" dataKey="redBand" stackId="band" stroke="none" fill="var(--status-bad-tint)" isAnimationActive={false} legendType="none" />
            <Area type="monotone" dataKey="amberBand" stackId="band" stroke="none" fill="var(--status-warn-tint)" isAnimationActive={false} legendType="none" />
            <Area type="monotone" dataKey="greenBand" stackId="band" stroke="none" fill="var(--status-good-tint)" isAnimationActive={false} legendType="none" />

            {/* Ross objective */}
            <Line type="monotone" dataKey="ross" name="Ross 308 target" stroke="var(--ink)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />

            {/* Actual weigh-ins per house */}
            {data.houses.map((h, i) => (
              <Line
                key={h.houseId}
                type="monotone"
                dataKey={h.houseId}
                name={h.houseName}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend: bands + houses */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-label">
        <span className="inline-flex items-center gap-1.5 text-slate"><Swatch className="bg-status-good-tint" /> ≥97% on track</span>
        <span className="inline-flex items-center gap-1.5 text-slate"><Swatch className="bg-status-warn-tint" /> 90–97% at risk</span>
        <span className="inline-flex items-center gap-1.5 text-slate"><Swatch className="bg-status-bad-tint" /> &lt;90% needs attention</span>
        <span className="inline-flex items-center gap-1.5 text-slate"><span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-ink" /> Ross 308</span>
      </div>
    </div>
  );
}

function Swatch({ className }: { className: string }) {
  return <span className={`inline-block size-3 rounded-[3px] ${className}`} />;
}
