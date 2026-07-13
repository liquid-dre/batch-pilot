import { describe, it, expect } from "vitest";
import { dailySaved, savedLabels } from "@/lib/copy";

/**
 * The save-confirmation copy lives in one place; these lock the plain, warm
 * voice (no "deaths" / "remaining") and the shape the surfaces render.
 */

const input = {
  houseName: "House 3",
  day: 12,
  mortality: 4,
  dayMortality: 4,
  nightMortality: 0,
  culls: 2,
  feedAddedKg: 4000,
  cumMort: 7,
  cumPct: 0.04,
  birdsRemaining: 15993,
};

describe("dailySaved — the daily confirmation family", () => {
  const c = dailySaved(input);

  it("reads what was saved and what it means, plainly", () => {
    expect(c.headline).toBe("House 3, day 12 is in.");
    expect(c.recorded).toBe("4 lost (4 day · 0 night), 2 culls, 4,000 kg feed.");
    expect(c.banner).toBe(
      "House 3, day 12 is in. 4 lost today — 7 lost so far this cycle, 15,993 birds still going.",
    );
  });

  it("uses the warm register, never the clinical words we're replacing", () => {
    const all = [c.headline, c.recorded, c.banner, c.toastTitle, c.toastDescription].join(" ");
    expect(all).not.toMatch(/deaths?|died|remaining|cumulative/i);
    expect(all).toMatch(/lost/);
    expect(c.banner).toMatch(/still going/);
  });

  it("groups the big numbers", () => {
    expect(c.banner).toContain("15,993");
    expect(c.recorded).toContain("4,000 kg");
  });

  it("carries the plain tile labels", () => {
    expect(savedLabels.lostThisCycle).toBe("Lost this cycle");
    expect(savedLabels.stillGoing).toBe("Birds still going");
  });

  it("shows a house temperature only when one was recorded", () => {
    expect(dailySaved({ ...input, tempC: 24 }).recorded).toContain("24°C");
    expect(c.recorded).not.toContain("°C");
  });
});
