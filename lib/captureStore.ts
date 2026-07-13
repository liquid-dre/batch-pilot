"use client";

import type { DailyEntry } from "@/lib/types";
import { useSessionPersisted } from "@/lib/usePersisted";

/**
 * What the supervisor has captured *today*, kept client-side (sessionStorage)
 * so it survives moving between the capture round and the Home dashboard, and
 * resets on refresh — matching the demo's "resets on refresh" note.
 *
 * `submitDailyUpdate` is a mock stub that doesn't persist, so the dashboard
 * can't read today's round from the seam; this store is that bridge. When
 * Convex lands, the dashboard reads the reactive farm query instead and this
 * hook's shape stays the same (keyed by date → per-house entry).
 */
export type TodaysCaptures = Record<string, DailyEntry>;

export function useTodaysCaptures(date: string): [TodaysCaptures, (next: TodaysCaptures) => void] {
  return useSessionPersisted<TodaysCaptures>(`bp.capture.${date}`, {});
}
