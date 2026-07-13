"use client";

import { useState } from "react";
import type { StatusLevel } from "@/lib/types";
import { submitWeights } from "@/lib/data";
import { ross308At } from "@/lib/data/ross308";
import { grams, num } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { StatusPill } from "@/components/ui/StatusPill";
import { BenchmarkToggle, useWeightCompareMode } from "@/components/ui/BenchmarkToggle";
import { notify } from "@/components/ui/notify";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatGap, vsBenchmark } from "@/lib/weightCompare";
import { weightsSavedToast, SAVING, saveFailedToast } from "@/lib/copy";
import { cn } from "@/lib/cn";

export interface WeightFormHouse {
  id: string;
  name: string;
  /** Current age in days (the weigh-in day). */
  day: number;
  lastWeightG: number;
}

interface Draft {
  avgWeightG: number;
  adgG: number;
  growthRatio: number;
  uniformityPct: number;
}

function levelFor(pct: number): StatusLevel {
  return pct >= 98 ? "green" : pct >= 90 ? "amber" : "red";
}

function initialDrafts(houses: WeightFormHouse[]): Record<string, Draft> {
  const out: Record<string, Draft> = {};
  for (const h of houses) {
    out[h.id] = {
      avgWeightG: h.lastWeightG || ross308At(h.day).weightG,
      adgG: 85,
      growthRatio: 1.2,
      uniformityPct: 70,
    };
  }
  return out;
}

export function WeightsForm({ houses }: { houses: WeightFormHouse[] }) {
  const [compareMode] = useWeightCompareMode();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => initialDrafts(houses));
  const [selectedId, setSelectedId] = useState(houses[0]?.id);
  const [savedPct, setSavedPct] = useState<Record<string, number>>({});

  const house = houses.find((h) => h.id === selectedId)!;
  const draft = drafts[selectedId];
  const target = ross308At(house.day).weightG;
  const pctOfTarget = Math.round((draft.avgWeightG / target) * 100);
  const level = levelFor(pctOfTarget);

  const update = (partial: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [selectedId]: { ...prev[selectedId], ...partial } }));

  async function handleSave() {
    try {
      const r = await notify.promise(submitWeights({ houseId: house.id, day: house.day, ...draft }), {
        loading: SAVING,
        success: (res) => {
          const t = weightsSavedToast(house.name, res.entry.avgWeightG, res.pctOfTarget);
          // Below the Ross target is a heads-up, not a plain success.
          return { title: t.title, description: t.description, tone: res.pctOfTarget >= 98 ? "success" : "warning" };
        },
        error: saveFailedToast,
      });
      setSavedPct((prev) => ({ ...prev, [house.id]: r.pctOfTarget }));
    } catch {
      /* error toast already shown */
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Weights"
        title="Record a weigh-in"
        intro="Enter the average weight and uniformity per house. We compare each one to the Ross 308 target for its age."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a house">
        {houses.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-pressed={h.id === selectedId}
            onClick={() => setSelectedId(h.id)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3.5 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              h.id === selectedId
                ? "bg-brand-700 text-white"
                : savedPct[h.id] !== undefined
                  ? "bg-status-good-tint text-status-good"
                  : "bg-surface text-slate border border-border hover:border-brand-500",
            )}
          >
            {h.name}
          </button>
        ))}
      </div>

      <Card key={selectedId} className="animate-rise">
        <CardBody className="space-y-6 pt-5">
          <div className="flex items-center justify-between">
            <CardEyebrow>
              {house.name} · Day {house.day}
            </CardEyebrow>
            <span className="text-label text-muted">Ross target {grams(target)}</span>
          </div>

          <Stepper label="Average weight" value={draft.avgWeightG} onChange={(v) => update({ avgWeightG: v })} step={5} max={6000} suffix="g" hint="Hold + or − to move faster." />
          <Stepper label="Average daily gain (ADG)" value={draft.adgG} onChange={(v) => update({ adgG: v })} max={200} suffix="g" />
          <Stepper label="Growth ratio" value={draft.growthRatio} onChange={(v) => update({ growthRatio: v })} step={0.1} decimals={1} min={0} max={3} />
          <Stepper label="Uniformity" value={draft.uniformityPct} onChange={(v) => update({ uniformityPct: v })} min={0} max={100} suffix="%" />

          <div className="rounded-[var(--radius-control)] bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-label text-muted">Against the Ross 308 curve</p>
              <BenchmarkToggle label="" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-data text-[1.0625rem] text-ink">
                  {formatGap(vsBenchmark(draft.avgWeightG, target), compareMode)}
                </p>
                <p className="mt-0.5 text-label text-muted">
                  {num(draft.avgWeightG)} / {num(target)} g · {pctOfTarget}% of target
                </p>
              </div>
              <StatusPill level={level} size="sm" />
            </div>
          </div>

          <Button size="lg" block onClick={handleSave}>
            Save weights
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
