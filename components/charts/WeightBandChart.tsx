"use client";

import * as Recharts from "recharts";
import type { WeightBandData } from "@/lib/view";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { compactGap, vsBenchmark, type WeightCompareMode } from "@/lib/weightCompare";

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

/** Specialised tooltip: drops the shaded-band series and annotates each house's
 *  gap to the Ross objective. Card styling matches the shadcn primitive. */
function BandTip({
  active,
  payload,
  label,
  compareMode,
}: {
  active?: boolean;
  payload?: TipItem[];
  label?: number;
  compareMode: WeightCompareMode;
}) {
  if (!active || !payload) return null;
  const rows = payload.filter((p) => !BAND_KEYS.has(String(p.dataKey)));
  if (rows.length === 0) return null;
  // Ross objective for the day, to annotate each house's gap per the toggle.
  const target = rows.find((p) => p.dataKey === "ross")?.value;
  return (
    <div className="rounded-[var(--radius-control)] border border-divider bg-surface px-3 py-2 shadow-card">
      <p className="text-label font-semibold text-ink">Day {label}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((p) => {
          const isHouse = p.dataKey !== "ross" && typeof p.value === "number" && typeof target === "number";
          return (
            <li key={String(p.dataKey)} className="flex items-center gap-2 text-[0.8125rem]">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: p.color }} />
              <span className="text-muted">{p.name}</span>
              <span className="ml-auto font-mono tabular-nums text-ink">
                {typeof p.value === "number" ? `${p.value.toLocaleString("en-US")} g` : "—"}
                {isHouse ? (
                  <span className="ml-1.5 text-muted">{compactGap(vsBenchmark(p.value!, target!), compareMode)}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WeightBandChart({ data, compareMode = "difference" }: { data: WeightBandData; compareMode?: WeightCompareMode }) {
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

  // Config drives the per-house colour injected as `--color-<houseId>` by
  // ChartContainer, keeping the vibrant chart palette config-driven.
  const config: ChartConfig = {
    ross: { label: "Ross 308 target", color: "var(--ink)" },
    ...Object.fromEntries(data.houses.map((h, i) => [h.houseId, { label: h.houseName, color: PALETTE[i % PALETTE.length] }])),
  };

  return (
    <div>
      <ChartContainer config={config} className="h-[340px]">
        <Recharts.ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <Recharts.CartesianGrid stroke="var(--divider)" vertical={false} />
          <Recharts.XAxis
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
          <Recharts.YAxis domain={[0, data.yMax]} tick={axisTick} stroke="var(--border)" tickLine={false} width={48} />
          <ChartTooltip content={(p) => <BandTip {...(p as unknown as { active?: boolean; payload?: TipItem[]; label?: number })} compareMode={compareMode} />} />

          {/* Shaded bands (stacked from 0): red < 90% · amber 90–97% · green ≥97% of Ross */}
          <Recharts.Area type="monotone" dataKey="redBand" stackId="band" stroke="none" fill="var(--status-bad-tint)" isAnimationActive={false} legendType="none" />
          <Recharts.Area type="monotone" dataKey="amberBand" stackId="band" stroke="none" fill="var(--status-warn-tint)" isAnimationActive={false} legendType="none" />
          <Recharts.Area type="monotone" dataKey="greenBand" stackId="band" stroke="none" fill="var(--status-good-tint)" isAnimationActive={false} legendType="none" />

          {/* Ross objective */}
          <Recharts.Line type="monotone" dataKey="ross" name="Ross 308 target" stroke="var(--color-ross)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />

          {/* Actual weigh-ins per house */}
          {data.houses.map((h) => (
            <Recharts.Line
              key={h.houseId}
              type="monotone"
              dataKey={h.houseId}
              name={h.houseName}
              stroke={`var(--color-${h.houseId})`}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </Recharts.ComposedChart>
      </ChartContainer>

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
