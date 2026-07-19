import { describe, it, expect } from "vitest";
import { getDashboardView, getDashboardMetrics, getWeightProjection } from "@/lib/data";

/**
 * The rebuilt dashboards render from one seam bundle. These lock the shape both
 * role dashboards depend on and the projection's reach/monotonicity.
 */
describe("getDashboardMetrics", () => {
  it("returns the four on-track metrics with a Ross reference each", async () => {
    const metrics = await getDashboardMetrics();
    expect(metrics.map((m) => m.key)).toEqual(["weight", "mortality", "feed", "fcr"]);
    for (const m of metrics) {
      expect(["green", "amber", "red"]).toContain(m.level);
      expect(m.target).toBeGreaterThan(0);
      expect(Number.isFinite(m.actual)).toBe(true);
    }
    // FCR + feed are estimates from feed delivered.
    expect(metrics.find((m) => m.key === "fcr")?.estimated).toBe(true);
    expect(metrics.find((m) => m.key === "feed")?.estimated).toBe(true);
  });
});

describe("getWeightProjection", () => {
  it("runs the projected line forward to the kill day, monotonic (ADG ≥ 0)", async () => {
    const p = await getWeightProjection();
    expect(p.ross.length).toBe(p.collectionDay + 1);
    const proj = p.site.projected;
    expect(proj.length).toBeGreaterThan(0);
    expect(proj[proj.length - 1].day).toBe(p.collectionDay);
    for (let i = 1; i < proj.length; i++) expect(proj[i].weightG).toBeGreaterThanOrEqual(proj[i - 1].weightG);
  });
});

describe("getDashboardView", () => {
  it("assembles cycle info, metrics, yesterday and projection", async () => {
    const v = await getDashboardView();
    expect(v.cycle.dayHigh).toBeGreaterThanOrEqual(v.cycle.dayLow);
    expect(v.cycle.houseCount).toBeGreaterThan(0);
    expect(v.metrics).toHaveLength(4);
    expect(v.yesterday.length).toBe(v.cycle.houseCount);
    expect(v.projection.site.actual.length).toBeGreaterThan(0);
  });
});
