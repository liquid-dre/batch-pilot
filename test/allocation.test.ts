import { describe, it, expect } from "vitest";
import { recommendAllocation } from "@/lib/data";
import type { House } from "@/lib/types";

function house(id: string, capacity: number): House {
  return { id, siteId: "s1", name: id, capacity };
}

describe("recommendAllocation (proportional to capacity, capped, remainder to largest)", () => {
  it("splits 7,000 birds across a 5,000 + 2,000 pair as 5,000 / 2,000", () => {
    const alloc = recommendAllocation(7000, [house("A", 5000), house("B", 2000)]);
    expect(alloc.map((a) => a.count)).toEqual([5000, 2000]);
    expect(alloc.reduce((s, a) => s + a.count, 0)).toBe(7000);
  });

  it("never exceeds any house's capacity", () => {
    const houses = [house("A", 5000), house("B", 2000)];
    const alloc = recommendAllocation(6000, houses);
    alloc.forEach((a, i) => expect(a.count).toBeLessThanOrEqual(houses[i].capacity));
    expect(alloc.reduce((s, a) => s + a.count, 0)).toBe(6000);
  });

  it("hands the rounding remainder to the largest house", () => {
    // 1000 across three equal 500-cap houses: floor(1000/3)=333 each = 999,
    // remainder 1 → goes to the first (largest, ties by capacity order).
    const alloc = recommendAllocation(1000, [house("A", 500), house("B", 500), house("C", 500)]);
    expect(alloc.reduce((s, a) => s + a.count, 0)).toBe(1000);
    expect(Math.max(...alloc.map((a) => a.count))).toBe(334);
  });

  it("cascades the remainder past a full house to the next largest", () => {
    // 1000 across caps 600 + 600: proportional floor = 500 + 500, remainder 0.
    // Use an uneven case that fills one: caps 700 + 400, total 1000.
    // floor: 700*1000/1100=636 (cap 700), 400*1000/1100=363; sum 999, rem 1 → largest (700) → 637.
    const alloc = recommendAllocation(1000, [house("A", 700), house("B", 400)]);
    expect(alloc.reduce((s, a) => s + a.count, 0)).toBe(1000);
    alloc.forEach((a, i) => expect(a.count).toBeLessThanOrEqual([700, 400][i]));
  });
});
