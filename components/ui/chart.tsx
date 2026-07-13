"use client";

import * as React from "react";
import * as Recharts from "recharts";
import { cn } from "@/lib/cn";

/**
 * shadcn-style chart primitives, trimmed to what BatchPilot needs and wired to
 * our brand tokens (no external UI framework — Recharts is already the chart
 * dep, per ROADMAP §4). A `ChartConfig` maps each data key to a label + a
 * colour; the colour is injected as a `--color-<key>` CSS variable on the
 * container so series reference `var(--color-<key>)` and re-theme with
 * `globals.css`. Keep charts calm: animation is off by default.
 */
export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within a <ChartContainer>");
  return ctx;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactElement }) {
  const style: React.CSSProperties = {};
  for (const [key, item] of Object.entries(config)) {
    if (item.color) (style as Record<string, string>)[`--color-${key}`] = item.color;
  }
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart
        className={cn("h-[200px] w-full text-label [&_.recharts-cartesian-axis-tick_text]:fill-muted", className)}
        style={style}
        {...props}
      >
        <Recharts.ResponsiveContainer>{children}</Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Recharts.Tooltip;

interface TooltipItem {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: React.ReactNode;
  /** Format a row's value; falls back to the raw value. */
  formatter?: (value: number | string | undefined, item: TooltipItem) => React.ReactNode;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-control)] border border-divider bg-surface px-3 py-2 shadow-card">
      {label != null ? <p className="mb-1 text-label font-medium text-ink">{label}</p> : null}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i);
          const swatch = item.color ?? `var(--color-${key})`;
          const name = config[key]?.label ?? item.name ?? key;
          return (
            <div key={key + i} className="flex items-center gap-2 text-label">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[2px]" style={{ background: swatch }} />
              <span className="text-slate">{name}</span>
              <span className="ml-auto font-mono tabular-nums text-ink">
                {formatter ? formatter(item.value, item) : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
