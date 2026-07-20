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
      <ContractBar siteId={siteId} linked={Boolean(detail.settlement?.contractLinked)} />
      <CloseCycleBar siteId={siteId} siteName={detail.siteName} cycleNo={detail.cycleNo} />
      <GrowerDetail data={detail} />
    </>
  );
}

/** Contractor: set/edit the contract terms (prices + FOC%) — unblocks settlement. */
function ContractBar({ siteId, linked }: { siteId: string; linked: boolean }) {
  const setContract = useMutation(api.tenancy.setContract);
  const [open, setOpen] = useState(false);
  const [chick, setChick] = useState("");
  const [feed, setFeed] = useState("");
  const [buyback, setBuyback] = useState("");
  const [foc, setFoc] = useState("1");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      await notify.promise(
        setContract({
          siteId,
          chickPrice: Number(chick) || 0,
          feedPricePerKg: Number(feed) || 0,
          buyBackPerKg: Number(buyback) || 0,
          focPct: Number(foc) || 0,
        }),
        {
          loading: "Saving contract…",
          success: () => ({ title: "Contract set", description: "Grower margin now shows on this cycle." }),
          error: () => ({ title: "Couldn't save the contract", description: "Try again." }),
        },
      );
      setOpen(false);
    } catch {
      /* toast shown */
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2 px-4 pt-6 sm:px-6">
        {!linked && <span className="text-label text-muted">No contract set — margin hidden.</span>}
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          {linked ? "Edit contract terms" : "Set contract terms"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <Card>
        <CardBody className="space-y-4 pt-5">
          <h3 className="text-h3">Contract terms</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PriceField label="Chick price" value={chick} onChange={setChick} />
            <PriceField label="Feed price / kg" value={feed} onChange={setFeed} />
            <PriceField label="Buy-back / kg" value={buyback} onChange={setBuyback} />
            <PriceField label="FOC %" value={foc} onChange={setFoc} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" loading={pending} onClick={save}>
              Save contract
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-slate">{label}</span>
      <input
        value={value}
        inputMode="decimal"
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-right font-mono text-body text-ink outline-none focus-visible:border-brand-500"
      />
    </label>
  );
}
