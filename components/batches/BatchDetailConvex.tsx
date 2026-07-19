"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Dataset } from "@/lib/data/dataset";
import type { BatchArchiveRow, BatchHistory } from "@/lib/view";
import type { EditRecord } from "@/lib/types";
import { getArchivedBatchHistory, getBatchArchiveRow, getEditLog } from "@/lib/data";
import { BatchDetailView } from "./BatchDetailView";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/** One batch's detail on Convex — archive row + full history + edit log, all
 *  derived from the reactive per-tenant myDataset for the signed-in grower. */
export function BatchDetailConvex({ id }: { id: string }) {
  const raw = useQuery(api.dataset.myDataset);
  const [state, setState] = useState<{ row: BatchArchiveRow | null; history: BatchHistory | null; editLog: EditRecord[] } | undefined>();

  useEffect(() => {
    if (raw === undefined) {
      setState(undefined);
      return;
    }
    if (!raw || !(raw as { batch: unknown }).batch) {
      setState({ row: null, history: null, editLog: [] });
      return;
    }
    let alive = true;
    const ds = raw as unknown as Dataset;
    Promise.all([getBatchArchiveRow(id, ds), getArchivedBatchHistory(id, ds), getEditLog(undefined, ds)]).then(
      ([row, history, editLog]) => {
        if (alive) setState({ row, history, editLog });
      },
    );
    return () => {
      alive = false;
    };
  }, [raw, id]);

  if (state === undefined) return <ScreenLoading eyebrow="Batch" title="Batch detail" />;
  if (!state.row || !state.history)
    return (
      <ScreenEmpty
        eyebrow="Batch"
        title="Batch detail"
        heading="Batch not found"
        body="This batch isn't on your farm, or hasn't been recorded yet."
      />
    );
  return <BatchDetailView row={state.row} history={state.history} editLog={state.editLog} />;
}
