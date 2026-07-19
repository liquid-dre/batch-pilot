"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Dataset } from "@/lib/data/dataset";
import type { BatchArchiveData } from "@/lib/view";
import { getBatchArchive } from "@/lib/data";
import { BatchArchiveView } from "./BatchArchiveView";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/** Previous batches on Convex — getBatchArchive on myDataset. Closed cycles fill
 *  in once closeCycle (Phase 2) archives them; for now it's the running cycle. */
export function BatchArchiveConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const hasCycle = Boolean(raw && (raw as { batch: unknown }).batch);
  const [data, setData] = useState<BatchArchiveData | undefined>();

  useEffect(() => {
    if (!hasCycle || !raw) {
      setData(undefined);
      return;
    }
    let alive = true;
    getBatchArchive(raw as unknown as Dataset).then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [raw, hasCycle]);

  if (raw === undefined) return <ScreenLoading eyebrow="Previous batches" title="Batch archive" />;
  if (!hasCycle)
    return (
      <ScreenEmpty
        eyebrow="Previous batches"
        title="Batch archive"
        heading="No batches yet"
        body="Your running and completed cycles will be listed here once a cycle is under way."
      />
    );
  if (!data) return <ScreenLoading eyebrow="Previous batches" title="Batch archive" />;
  return <BatchArchiveView data={data} />;
}
