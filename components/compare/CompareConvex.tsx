"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Dataset } from "@/lib/data/dataset";
import type { CompareData } from "@/lib/view";
import { getComparableBatches } from "@/lib/data";
import { CompareView } from "./CompareView";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/** Batch comparison on Convex — the pure getComparableBatches on myDataset. */
export function CompareConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const hasCycle = Boolean(raw && (raw as { batch: unknown }).batch);
  const [data, setData] = useState<CompareData | undefined>();

  useEffect(() => {
    if (!hasCycle || !raw) {
      setData(undefined);
      return;
    }
    let alive = true;
    getComparableBatches(raw as unknown as Dataset).then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [raw, hasCycle]);

  if (raw === undefined) return <ScreenLoading eyebrow="Compare" title="Batch comparison" />;
  if (!hasCycle)
    return (
      <ScreenEmpty
        eyebrow="Compare"
        title="Batch comparison"
        heading="No cycle to compare yet"
        body="Once a cycle is running, its day-by-day trend appears here alongside your past cycles."
      />
    );
  if (!data) return <ScreenLoading eyebrow="Compare" title="Batch comparison" />;
  return <CompareView data={data} />;
}
