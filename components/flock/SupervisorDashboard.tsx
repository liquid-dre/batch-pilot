"use client";

import { useRouter } from "next/navigation";
import type { DashboardView } from "@/lib/view";
import { useTodaysCaptures } from "@/lib/captureStore";
import { Button } from "@/components/ui/Button";
import { CycleInfo } from "@/components/dashboard/CycleInfo";
import { OnTrackCards } from "@/components/dashboard/OnTrackCards";
import { PreviousDayEntries } from "@/components/dashboard/PreviousDayEntries";
import { ProjectionChart } from "@/components/dashboard/ProjectionChart";
import { IconArrowRight } from "@/components/icons";

/**
 * The supervisor's Home — the shared dashboard structure at the plain depth,
 * led by the capture CTA (their one job). Cycle info → capture → on-track cards
 * → yesterday's entries → projection. Read-only apart from the CTA.
 */
export function SupervisorDashboard({ data }: { data: DashboardView }) {
  const router = useRouter();
  const [captures] = useTodaysCaptures(data.cycle.today);
  const done = Object.keys(captures).length;
  const total = data.cycle.houseCount;
  const ctaLabel = done === 0 ? "Capture today's results" : done < total ? "Add the rest" : "Review today's round";

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-7 sm:px-6 sm:py-9">
      <CycleInfo cycle={data.cycle} />

      <Button size="lg" block onClick={() => router.push("/app/capture")}>
        {ctaLabel}
        <IconArrowRight className="size-5" />
      </Button>

      <OnTrackCards metrics={data.metrics} variant="supervisor" />
      <PreviousDayEntries entries={data.yesterday} variant="supervisor" />
      <ProjectionChart projection={data.projection} variant="supervisor" />
    </div>
  );
}
