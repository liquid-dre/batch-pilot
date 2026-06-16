/**
 * Display helpers. Components format through these rather than calling Date()
 * or toLocaleString() inline, so number/date presentation stays consistent and
 * timezone-safe (ISO date strings are parsed as UTC, never as local time).
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Group digits with thin separators: 94783 → "94,783". */
export function num(value: number): string {
  return value.toLocaleString("en-US");
}

/** Percentage to a fixed number of places: 2.182 → "2.18%". */
export function pct(value: number, places = 2): string {
  return `${value.toFixed(places)}%`;
}

/** Grams with a unit: 1401 → "1,401 g". */
export function grams(value: number): string {
  return `${num(value)} g`;
}

/** Kilograms with a unit: 14820 → "14,820 kg". */
export function kg(value: number): string {
  return `${num(value)} kg`;
}

/** ISO 'YYYY-MM-DD' → "15 Jun 2026". */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Whole days from `from` to `to` (both ISO). Negative if `to` is past. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

/** ISO date `n` days after `iso` (n may be negative), returned as ISO. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86_400_000);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}
