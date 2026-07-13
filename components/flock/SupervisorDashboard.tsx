"use client";

import { useRouter } from "next/navigation";
import * as Recharts from "recharts";
import { useCurrentUser } from "@/lib/auth";
import type { CaptureHouse, SupervisorCaptureData } from "@/lib/view";
import type { DailyEntry } from "@/lib/types";
import { useTodaysCaptures } from "@/lib/captureStore";
import { compareToStandard, type Standing, type StandingLevel } from "@/lib/standing";
import { kg, longDate, num } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { IconArrowRight, IconDailyUpdate, IconStatusGood, IconStatusWarn, IconStatusBad, type IconComponent } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * The supervisor's Home — a calm orientation surface, not a control panel. Its
 * one job: answer "have I done today's round, and how did it land?" One primary
 * CTA drops into the capture screen. If nothing is in for today it says so; once
 * houses are recorded it shows a card each (what was captured + whether it's on
 * or off the day's standard, and by how much), plus a light chart of the gap.
 * Read-only — the supervisor captures and views, never configures.
 */
export function SupervisorDashboard({ data }: { data: SupervisorCaptureData }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const firstName = user.name.split(" ")[0];
  const [captures] = useTodaysCaptures(data.today);

  const rows = data.houses.map((house) => {
    const entry = captures[house.id];
    return { house, entry, standing: entry ? compareToStandard(entry.cumPct, house.standardCumMortPct) : null };
  });
  const captured = rows.filter((r) => r.entry);
  const done = captured.length;
  const total = data.houses.length;

  const goCapture = () => router.push("/app/capture");
  const ctaLabel = done === 0 ? "Capture today's results" : done < total ? "Add the rest" : "Review today's round";
  const subline =
    done === 0
      ? "Nothing recorded yet today."
      : done < total
        ? `${done} of ${total} houses recorded — ${total - done} still to go.`
        : `All ${total} houses recorded. Nice work, ${firstName}.`;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-7 sm:px-6 sm:py-9">
      <header className="animate-rise">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint font-mono">
          {data.siteName} · Cycle {data.cycleNo} · {data.breed}
        </p>
        <h1 className="mt-2 text-h1">{longDate(data.today)}</h1>
        <p className="mt-1.5 text-body-l text-slate">{subline}</p>
      </header>

      <Button size="lg" block onClick={goCapture}>
        {ctaLabel}
        <IconArrowRight className="size-5" />
      </Button>

      {done === 0 ? (
        <EmptyState
          icon={<IconDailyUpdate className="size-6" />}
          title="Nothing recorded yet today"
          body="When you finish today's round, each house shows up here with what you entered and whether it's on the day's standard."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(({ house, entry, standing }) =>
              entry && standing ? (
                <CapturedCard key={house.id} house={house} entry={entry} standing={standing} />
              ) : (
                <PendingCard key={house.id} house={house} onAdd={goCapture} />
              ),
            )}
          </div>

          <DeviationChart rows={captured} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ pieces --- */

const STANDING_ICON: Record<StandingLevel, IconComponent> = {
  good: IconStatusGood,
  warn: IconStatusWarn,
  bad: IconStatusBad,
};
const STANDING_STYLE: Record<StandingLevel, string> = {
  good: "bg-status-good-tint text-status-good",
  warn: "bg-status-warn-tint text-status-warn",
  bad: "bg-status-bad-tint text-status-bad",
};
const STANDING_FILL: Record<StandingLevel, string> = {
  good: "var(--status-good)",
  warn: "var(--status-warn)",
  bad: "var(--status-bad)",
};

function StandingPill({ standing }: { standing: Standing }) {
  const Icon = STANDING_ICON[standing.level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-label font-medium", STANDING_STYLE[standing.level])}>
      <Icon className="size-3.5 shrink-0" />
      {standing.word}
    </span>
  );
}

function CapturedCard({ house, entry, standing }: { house: CaptureHouse; entry: DailyEntry; standing: Standing }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-h3">{house.name}</h3>
            <p className="text-label text-muted">Day {entry.day}</p>
          </div>
          <StandingPill standing={standing} />
        </div>
        <p className="text-body text-slate">
          {num(entry.mortality)} lost · {num(entry.culls)} culls · {kg(entry.feedAddedKg)} feed
        </p>
        <p className="text-label text-muted">
          {standing.detail} · {num(entry.birdsRemaining)} birds still going
        </p>
      </CardBody>
    </Card>
  );
}

function PendingCard({ house, onAdd }: { house: CaptureHouse; onAdd: () => void }) {
  return (
    <Card className="border-dashed bg-transparent shadow-none">
      <CardBody className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-h3 text-slate">{house.name}</h3>
          <p className="text-label text-muted">Not in yet</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          Add
        </Button>
      </CardBody>
    </Card>
  );
}

/** Percentage points above (over) or below (under) the day's standard, per house. */
function DeviationChart({ rows }: { rows: { house: CaptureHouse; entry: DailyEntry | undefined; standing: Standing | null }[] }) {
  const chartData = rows
    .filter((r) => r.entry && r.standing)
    .map((r) => ({
      name: r.house.name,
      deviation: Number((r.entry!.cumPct - r.house.standardCumMortPct).toFixed(2)),
      fill: STANDING_FILL[r.standing!.level],
    }));

  return (
    <Card>
      <CardBody className="space-y-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-hint font-mono">Losses vs the day&apos;s standard</p>
          <p className="mt-1 text-label text-muted">Percentage points over (above the line) or under (below) the contractor standard, by house.</p>
        </div>
        <ChartContainer config={{ deviation: { label: "vs standard" } }} className="h-[190px]">
          <Recharts.BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <Recharts.CartesianGrid vertical={false} stroke="var(--divider)" />
            <Recharts.XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <Recharts.YAxis width={34} tickLine={false} axisLine={false} />
            <Recharts.ReferenceLine y={0} stroke="var(--hint)" />
            <ChartTooltip
              cursor={{ fill: "var(--brand-50)" }}
              content={<ChartTooltipContent formatter={(v) => `${Number(v) > 0 ? "+" : ""}${v} pp`} />}
            />
            <Recharts.Bar dataKey="deviation" radius={4} isAnimationActive={false}>
              {chartData.map((d, i) => (
                <Recharts.Cell key={i} fill={d.fill} />
              ))}
            </Recharts.Bar>
          </Recharts.BarChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
}
