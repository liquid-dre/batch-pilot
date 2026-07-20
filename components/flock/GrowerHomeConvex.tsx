"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Dataset } from "@/lib/data/dataset";
import type { DashboardView } from "@/lib/view";
import { getDashboardView } from "@/lib/data";
import { useCurrentUser } from "@/lib/auth";
import { GrowerDashboard } from "./GrowerDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * The grower home in Convex mode. Until the farm has a running cycle it is the
 * onboarding/setup hub (set up houses, start the cycle, invite the team); once a
 * cycle exists it becomes the real Dashboard, computed from the reactive
 * per-tenant `myDataset` through the same pure `getDashboardView` builder the
 * mock demo uses. Supervisor and manager get the same DashboardView at their
 * respective depths (capture-led vs analytics-led), matching the mock RoleHome.
 */
export function GrowerHomeConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const { role } = useCurrentUser();
  const [view, setView] = useState<DashboardView | undefined>();

  const hasCycle = Boolean(raw && (raw as { batch: unknown }).batch);

  useEffect(() => {
    if (!hasCycle || !raw) {
      setView(undefined);
      return;
    }
    let alive = true;
    const today = new Date().toISOString().slice(0, 10);
    getDashboardView(raw as unknown as Dataset, today).then((v) => {
      if (alive) setView(v);
    });
    return () => {
      alive = false;
    };
  }, [raw, hasCycle]);

  if (raw === undefined) return <HomeLoading />;
  // No running cycle yet (or not a grower dataset) → the setup/onboarding hub.
  if (!hasCycle) return <Onboarding />;
  if (!view) return <HomeLoading />;

  return role === "supervisor" ? <SupervisorDashboard data={view} /> : <GrowerDashboard data={view} />;
}

function HomeLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Home" title="Loading your farm…" />
      <Card>
        <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
          Loading…
        </CardBody>
      </Card>
    </div>
  );
}
