import { describe, it, expect } from "vitest";
import { getBatchArchive, getArchivedBatchHistory, getBatchArchiveRow } from "@/lib/data";

/**
 * The Previous Batches archive: the table rows (current + closed cycles) and the
 * per-batch history reused by the detail page. Closed batches are generated
 * deterministically; their headline figures must match the documented seeds, and
 * the generated history must conform to the same BatchHistory shape the History &
 * Charts view renders for the live batch.
 */
describe("getBatchArchive (Previous Batches table)", () => {
  it("lists the current batch plus the closed cycles, newest first", async () => {
    const { rows } = await getBatchArchive();
    const cycles = rows.map((r) => r.cycleNo);
    expect(cycles).toEqual([85, 84, 83, 82, 81]);
    expect(rows[0].status).toBe("current");
    expect(rows.slice(1).every((r) => r.status === "closed")).toBe(true);
  });

  it("flags the under-performing live batch red and the strong closed cycles green", async () => {
    const { rows } = await getBatchArchive();
    const current = rows.find((r) => r.status === "current")!;
    expect(current.vsRossPct).toBeLessThan(90);
    expect(current.level).toBe("red");
    const c83 = rows.find((r) => r.cycleNo === 83)!;
    expect(c83.level).toBe("green");
  });

  it("derives totals: every row has positive placed, feed used and a vaccine program", async () => {
    const { rows } = await getBatchArchive();
    for (const r of rows) {
      expect(r.placed).toBeGreaterThan(0);
      expect(r.feedUsedKg).toBeGreaterThan(0);
      expect(r.totalMortality).toBeGreaterThan(0);
      expect(r.vaccineCount).toBe(r.vaccineNames.length);
    }
  });
});

describe("getArchivedBatchHistory (detail-page reuse of History & Charts)", () => {
  it("returns the live batch's real history for the current id", async () => {
    const { rows } = await getBatchArchive();
    const current = rows.find((r) => r.status === "current")!;
    const history = await getArchivedBatchHistory(current.id);
    expect(history).not.toBeNull();
    expect(history!.houses.length).toBe(6);
  });

  it("generates a full, conformant per-house history for a closed batch", async () => {
    const row = (await getBatchArchive()).rows.find((r) => r.cycleNo === 84)!;
    const history = await getArchivedBatchHistory(row.id);
    expect(history).not.toBeNull();
    expect(history!.houses.length).toBe(6);
    expect(history!.maxDay).toBe(row.growOutDays);
    // Batch rollup spans every day, and the final day's cum% is in a sane range.
    expect(history!.batch).toHaveLength(row.growOutDays);
    const last = history!.batch[history!.batch.length - 1];
    expect(last.cumPct).toBeGreaterThan(0);
    expect(last.cumPct).toBeLessThan(15);
    // Each house has weigh-ins that reach the final day.
    expect(history!.houses.every((h) => h.rows.some((r) => r.day === row.growOutDays && r.weigh))).toBe(true);
  });

  it("returns null for an unknown batch id", async () => {
    expect(await getArchivedBatchHistory("batch_nope")).toBeNull();
    expect(await getBatchArchiveRow("batch_nope")).toBeNull();
  });
});
