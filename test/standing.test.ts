import { describe, it, expect } from "vitest";
import { compareToStandard } from "@/lib/standing";

/**
 * The supervisor capture screen and the Home dashboard both classify a house
 * against the day's contractor standard through this one function, so the pill
 * word/colour and the dashboard's deviation always agree. Lock the bands.
 */
describe("compareToStandard", () => {
  it("well under standard reads as good, 'below'", () => {
    const s = compareToStandard(2.0, 2.5);
    expect(s.level).toBe("good");
    expect(s.word).toBe("Below the day's standard");
    expect(s.detail).toBe("0.5% under standard");
  });

  it("within ±0.15pp reads as on-standard", () => {
    expect(compareToStandard(2.5, 2.5).word).toBe("On the day's standard");
    expect(compareToStandard(2.6, 2.5).level).toBe("good"); // +0.1 still on
    expect(compareToStandard(2.5, 2.5).detail).toBe("right on target");
  });

  it("slightly over reads as a warning", () => {
    const s = compareToStandard(2.8, 2.5); // +0.3pp
    expect(s.level).toBe("warn");
    expect(s.word).toBe("Slightly above the standard");
    expect(s.detail).toBe("0.3% over standard");
  });

  it("well over reads as bad", () => {
    const s = compareToStandard(3.2, 2.5); // +0.7pp
    expect(s.level).toBe("bad");
    expect(s.word).toBe("Above the day's standard");
    expect(s.detail).toBe("0.7% over standard");
  });
});
