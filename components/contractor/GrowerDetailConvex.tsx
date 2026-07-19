"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { GrowerDetailData } from "@/lib/view";
import { GrowerDetail } from "./GrowerDetail";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/notify";

/**
 * Convex-backed grower drill-down for the contractor. Tenant-guarded query, plus
 * the contractor-only "End cycle" action (ROADMAP §9 — cycle close is
 * contractor-driven): closing archives the cycle's finals and frees the farm to
 * start the next one, after which this view shows the farm as no-longer-active.
 */
function CloseCycleBar({ siteId, siteName, cycleNo }: { siteId: string; siteName: string; cycleNo: number }) {
  const close = useMutation(api.tenancy.closeCycle);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function doClose() {
    setPending(true);
    try {
      await notify.promise(close({ siteId }), {
        loading: "Closing the cycle…",
        success: (r: { cycleNo: number; finalWeightG: number; finalCumMortPct: number }) => ({
          title: `Cycle ${r.cycleNo} closed`,
          description: `Archived at ${r.finalWeightG.toLocaleString()} g · ${r.finalCumMortPct}% mortality. ${siteName} can start a new cycle.`,
        }),
        error: () => ({ title: "Couldn't close the cycle", description: "Try again." }),
      });
      setConfirming(false);
    } catch {
      /* error toast already shown */
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2 px-4 pt-6 sm:px-6">
      {confirming ? (
        <>
          <span className="text-label text-muted">End cycle {cycleNo} for {siteName}?</span>
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" loading={pending} onClick={doClose}>
            Confirm end cycle
          </Button>
        </>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
          End cycle
        </Button>
      )}
    </div>
  );
}

export function GrowerDetailConvex({ siteId }: { siteId: string }) {
  const data = useQuery(api.growers.contractorGrowerDetail, { siteId });

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <PageHeader back={{ href: "/app/growers", label: "Growers" }} eyebrow="Grower" title="Loading…" />
        <Card>
          <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
            Loading…
          </CardBody>
        </Card>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
        <h1 className="text-h2">Grower not found</h1>
        <p className="text-body text-slate">This farm isn&apos;t linked to your contractor account, or has no active cycle.</p>
      </div>
    );
  }

  const detail = data as GrowerDetailData;
  return (
    <>
      <CloseCycleBar siteId={siteId} siteName={detail.siteName} cycleNo={detail.cycleNo} />
      <GrowerDetail data={detail} />
    </>
  );
}
