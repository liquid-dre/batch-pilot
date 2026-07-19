"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Dataset } from "@/lib/data/dataset";
import type { BatchHistory } from "@/lib/view";
import type { EditRecord } from "@/lib/types";
import { getBatchHistory, getEditLog } from "@/lib/data";
import { HistoryView } from "./HistoryView";
import { ScreenLoading, ScreenEmpty } from "@/components/shell/ScreenState";

/**
 * History & charts on Convex — getBatchHistory + getEditLog run on the reactive
 * per-tenant myDataset. A manager's correction persists through
 * writes.submitManagerEdit (server-authoritative attribution); the dataset then
 * re-fires and HistoryView re-seeds, so the re-derived chain + audit trail
 * render live without a manual refetch.
 */
export function HistoryConvex() {
  const raw = useQuery(api.dataset.myDataset);
  const submit = useMutation(api.writes.submitManagerEdit);
  const hasCycle = Boolean(raw && (raw as { batch: unknown }).batch);
  const [state, setState] = useState<{ history: BatchHistory; editLog: EditRecord[] } | undefined>();

  useEffect(() => {
    if (!hasCycle || !raw) {
      setState(undefined);
      return;
    }
    let alive = true;
    const ds = raw as unknown as Dataset;
    Promise.all([getBatchHistory(ds), getEditLog(undefined, ds)]).then(([history, editLog]) => {
      if (alive) setState({ history, editLog });
    });
    return () => {
      alive = false;
    };
  }, [raw, hasCycle]);

  if (raw === undefined) return <ScreenLoading eyebrow="Records" title="History & charts" />;
  if (!hasCycle)
    return (
      <ScreenEmpty
        eyebrow="Records"
        title="History & charts"
        heading="No cycle history yet"
        body="Once a cycle is running and days are captured, the day-by-day history and charts appear here."
      />
    );
  if (!state) return <ScreenLoading eyebrow="Records" title="History & charts" />;

  return (
    <HistoryView
      data={state.history}
      editLog={state.editLog}
      save={(input) => submit({ entityId: input.entityId, changes: input.changes })}
    />
  );
}
