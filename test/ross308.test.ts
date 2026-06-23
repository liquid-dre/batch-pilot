import { describe, it, expect } from "vitest";
import { mortalityBandPctAt } from "@/lib/data/ross308";

describe("mortalityBandPctAt (the day's standard cumulative-mortality ceiling)", () => {
  it("returns the exact band value on a band day", () => {
    expect(mortalityBandPctAt(28)).toBeCloseTo(2.8, 5);
    expect(mortalityBandPctAt(21)).toBeCloseTo(2.2, 5);
  });

  it("linearly interpolates between band days (day 27 sits between 21 and 28)", () => {
    // 2.2 + (2.8 - 2.2) * (27 - 21) / (28 - 21) = 2.71428…
    expect(mortalityBandPctAt(27)).toBeCloseTo(2.2 + (0.6 * 6) / 7, 5);
  });

  it("clamps below the first and above the last band point", () => {
    expect(mortalityBandPctAt(1)).toBeCloseTo(1.0, 5); // first point (day 7 → 1.0)
    expect(mortalityBandPctAt(60)).toBeCloseTo(4.2, 5); // last point (day 42 → 4.2)
  });
});
