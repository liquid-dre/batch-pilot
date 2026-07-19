"use client";

import { useState } from "react";
import * as Recharts from "recharts";
import type { WeightProjection } from "@/lib/view";
import { num } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/cn";

/**
 * Weight projection against the Ross 308 curve: actual weigh-ins to date as a
 * solid line, then a dashed projected line (current weight + ADG × days-left)
 * running forward to the collection date, over the shaded green/amber/red band. Built
 * on the shadcn-style chart primitive. The manager variant can toggle to each
 * house's line; the supervisor sees one calm site-average line.
 */
const HOUSE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

export function ProjectionChart({ projection, variant }: { projection: WeightProjection; variant: "supervisor" | "manager" }) {
  const [byHouse, setByHouse] = useState(false);
  const showHouses = variant === "manager" && byHouse;

  const { ross, collectionDay, yMax, greenFrac, amberFrac } = projection;

  // Per-house continuous series (actual, then projected from the weigh day on).
  const houseMaps = projection.houses.map((h) => {
    const m = new Map<number, number>();
    for (const p of h.actual) m.set(p.day, p.weightG);
    for (const p of h.projected) if (!m.has(p.day)) m.set(p.day, p.weightG);
    return { name: h.name, m };
  });
  const siteActual = new Map(projection.site.actual.map((p) => [p.day, p.weightG]));
  const siteProjected = new Map(projection.site.projected.map((p) => [p.day, p.weightG]));

  const data = ross.map((r) => {
    const ross97 = r.weightG * greenFrac;
    const ross90 = r.weightG * amberFrac;
    const row: Record<string, number | null> = {
      day: r.day,
      bandRed: Math.round(ross90),
      bandAmber: Math.round(ross97 - ross90),
      bandGreen: Math.max(0, yMax - Math.round(ross97)),
      ross: r.weightG,
      siteActual: siteActual.get(r.day) ?? null,
      siteProjected: siteProjected.get(r.day) ?? null,
    };
    houseMaps.forEach((h, i) => (row[`h${i}`] = h.m.get(r.day) ?? null));
    return row;
  });

  const config: ChartConfig = {
    ross: { label: "Ross target" },
    siteActual: { label: "Actual", color: "var(--brand-600)" },
    siteProjected: { label: "Projected", color: "var(--brand-500)" },
    ...Object.fromEntries(houseMaps.map((h, i) => [`h${i}`, { label: h.name, color: HOUSE_COLORS[i % HOUSE_COLORS.length] }])),
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-h3">Weight projection vs Ross 308</h2>
        {variant === "manager" ? (
          <div className="inline-flex rounded-[var(--radius-pill)] border border-border p-0.5 text-label">
            {(["Site", "Houses"] as const).map((opt) => {
              const active = (opt === "Houses") === byHouse;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setByHouse(opt === "Houses")}
                  className={cn(
                    "rounded-[var(--radius-pill)] px-3 py-1 font-medium transition-colors",
                    active ? "bg-brand-700 text-white" : "text-slate hover:text-ink",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <Card>
        <CardBody>
          <ChartContainer config={config} className="h-[260px]">
            <Recharts.ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <Recharts.CartesianGrid vertical={false} stroke="var(--divider)" />
              <Recharts.XAxis
                dataKey="day"
                type="number"
                domain={[0, collectionDay]}
                ticks={weeklyTicks(collectionDay)}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(d) => `d${d}`}
              />
              <Recharts.YAxis domain={[0, yMax]} width={40} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              {/* Shaded green/amber/red band (stacked to yMax); excluded from the tooltip. */}
              <Recharts.Area dataKey="bandRed" stackId="band" stroke="none" fill="var(--status-bad-tint)" tooltipType="none" isAnimationActive={false} />
              <Recharts.Area dataKey="bandAmber" stackId="band" stroke="none" fill="var(--status-warn-tint)" tooltipType="none" isAnimationActive={false} />
              <Recharts.Area dataKey="bandGreen" stackId="band" stroke="none" fill="var(--status-good-tint)" tooltipType="none" isAnimationActive={false} />

              <Recharts.Line dataKey="ross" stroke="var(--hint)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />

              {showHouses ? (
                houseMaps.map((_, i) => (
                  <Recharts.Line
                    key={i}
                    dataKey={`h${i}`}
                    stroke={HOUSE_COLORS[i % HOUSE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))
              ) : (
                <>
                  <Recharts.Line dataKey="siteActual" stroke="var(--color-siteActual)" strokeWidth={2.5} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
                  <Recharts.Line dataKey="siteProjected" stroke="var(--color-siteProjected)" strokeWidth={2.5} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
                </>
              )}

              <Recharts.ReferenceLine x={collectionDay} stroke="var(--slate)" strokeDasharray="2 3" label={{ value: "collection", position: "insideTopRight", fontSize: 11, fill: "var(--muted)" }} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => (v == null ? "—" : `${num(Number(v))} g`)} />}
                labelFormatter={(d) => `Day ${d}`}
              />
            </Recharts.ComposedChart>
          </ChartContainer>
        </CardBody>
      </Card>
    </section>
  );
}

/** Weekly-ish ticks (every 7 days) up to and including the collection day. */
function weeklyTicks(collectionDay: number): number[] {
  const ticks: number[] = [];
  for (let d = 0; d <= collectionDay; d += 7) ticks.push(d);
  if (ticks[ticks.length - 1] !== collectionDay) ticks.push(collectionDay);
  return ticks;
}
