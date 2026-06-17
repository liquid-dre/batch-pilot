"use client";

import type { AllocatedHouse } from "@/lib/data";
import { usePersisted } from "@/lib/usePersisted";

/**
 * The confirmed allocation lives client-side (localStorage) so the done-state
 * survives navigation and refresh. `confirmAllocation` in the seam runs in the
 * browser, so the read has to live there too — a server component can't see that
 * write. When Convex lands, this becomes a query against the persisted row and
 * the hook signature stays the same.
 */
export function useConfirmedAllocation(plannedId: string) {
  return usePersisted<AllocatedHouse[] | null>(`bp.allocation.${plannedId}`, null);
}
