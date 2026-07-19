import type { FlockAlert } from "@/lib/types";

/**
 * Stable identity for a dismissable alert: house + flagged metric + severity.
 * Keying on the level means a dismissed alert re-appears if the house's problem
 * changes metric or escalates/eases. Shared by the alerts list and the nav badge
 * so both filter dismissals identically.
 */
export function alertKey(houseId: string, metric: string, level: string): string {
  return `${houseId}:${metric}:${level}`;
}

export function flockAlertKey(a: FlockAlert): string {
  return alertKey(a.houseId, a.status.metric, a.status.level);
}
