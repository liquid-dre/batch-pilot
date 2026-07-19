"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Dataset } from "@/lib/data/dataset";
import type { FlockAlert } from "@/lib/types";
import { getAlerts } from "@/lib/data";
import { alertKey, flockAlertKey } from "@/lib/alertKey";
import { AlertsList } from "./AlertsList";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * The grower alerts list on Convex — the same rule-based `getAlerts` engine run
 * on the reactive per-tenant `myDataset`. Empty (with the "on track" state) until
 * houses cross a band, so a farm with no cycle simply shows nothing to do.
 */
export function AlertsConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const dismissedRows = useQuery(api.alerts.myDismissedAlerts);
  const dismiss = useMutation(api.alerts.dismissAlert);
  const [alerts, setAlerts] = useState<FlockAlert[] | undefined>();

  useEffect(() => {
    if (raw === undefined) {
      setAlerts(undefined);
      return;
    }
    if (raw === null) {
      setAlerts([]);
      return;
    }
    let alive = true;
    getAlerts(raw as unknown as Dataset).then((a) => {
      if (alive) setAlerts(a);
    });
    return () => {
      alive = false;
    };
  }, [raw]);

  const dismissedSet = useMemo(
    () => new Set((dismissedRows ?? []).map((d) => alertKey(d.houseId, d.metric, d.level))),
    [dismissedRows],
  );
  const visible = useMemo(
    () => (alerts ?? []).filter((a) => !dismissedSet.has(flockAlertKey(a))),
    [alerts, dismissedSet],
  );

  if (alerts === undefined) {
    return (
      <Card>
        <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
          Loading…
        </CardBody>
      </Card>
    );
  }
  return (
    <AlertsList
      alerts={visible}
      onDismiss={(a) => {
        void dismiss({ houseId: a.houseId, metric: a.status.metric, level: a.status.level });
      }}
    />
  );
}
