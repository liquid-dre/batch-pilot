import { describe, it, expect } from "vitest";
import {
  evaluateWeight,
  evaluateMortality,
  evaluateFcr,
  evaluateFeedIntake,
  evaluatePlacement,
  type EngineContext,
} from "@/lib/engine";
import { ROSS_308_CURVE, ROSS_308_OVERLAY } from "@/lib/data/ross308";

// Real Ross 308 curve + contractor overlay — the engine is pure, so we just
// pass them in. Ross weight at day 28 is 1616 g; the cumulative-mortality band
// ceiling at day 28 is 2.8%.
const ctx: EngineContext = { curve: ROSS_308_CURVE, overlay: ROSS_308_OVERLAY };

describe("evaluateWeight (vs Ross, thresholds 0.97 / 0.90)", () => {
  it("flags the Nhunge day-28 ~1400 g flock as red (1400/1616 = 87%)", () => {
    const s = evaluateWeight(28, 1400, ctx);
    expect(s.level).toBe("red");
    expect(s.metric).toBe("Weight");
    expect(s.cause).toBeTruthy(); // red carries a cause + fix
    expect(s.fix).toBeTruthy();
  });

  it("is amber in the 90–97% band (1500/1616 = 93%)", () => {
    expect(evaluateWeight(28, 1500, ctx).level).toBe("amber");
  });

  it("is green at or above 97% of target (1600/1616 = 99%)", () => {
    const s = evaluateWeight(28, 1600, ctx);
    expect(s.level).toBe("green");
    expect(s.cause).toBeUndefined(); // green needs no cause/fix
  });

  it("sits right on the 90% boundary as amber, not red", () => {
    // 90% of 1616 = 1454.4 → 1455 g is ≥ 0.90 → amber
    expect(evaluateWeight(28, 1455, ctx).level).toBe("amber");
  });
});

describe("evaluateMortality (vs contractor band, 2.8% at day 28)", () => {
  it("is green well under the band", () => {
    expect(evaluateMortality(28, 1.0, ctx).level).toBe("green");
  });

  it("is amber from 85% of the band (2.5/2.8 = 89%)", () => {
    expect(evaluateMortality(28, 2.5, ctx).level).toBe("amber");
  });

  it("is red at or over the band (3.0 > 2.8)", () => {
    expect(evaluateMortality(28, 3.0, ctx).level).toBe("red");
  });
});

describe("evaluateFcr (vs Ross fcr, +3% / +8%)", () => {
  it("is green at the target fcr", () => {
    expect(evaluateFcr(28, 1.269, ctx).level).toBe("green"); // Ross fcr at day 28
  });

  it("is red well above target (1.40 is +10%)", () => {
    expect(evaluateFcr(28, 1.4, ctx).level).toBe("red");
  });
});

describe("evaluateFeedIntake (bin-refill flag, >120% of intake)", () => {
  it("flags feed added far above the intake target as a likely refill (amber)", () => {
    // Ross daily intake at day 28 is 145 g; 200 g/bird is ~138% → refill.
    expect(evaluateFeedIntake(28, 200, ctx).level).toBe("amber");
  });

  it("is green at normal intake", () => {
    expect(evaluateFeedIntake(28, 140, ctx).level).toBe("green");
  });
});

describe("evaluatePlacement (overall = worst metric)", () => {
  it("returns red overall, on Weight, when the flock is well under weight", () => {
    const { overall, metrics } = evaluatePlacement(
      { day: 28, weightG: 1400, weightDay: 28, cumMortPct: 1.0, fcr: 1.27 },
      ctx,
    );
    expect(overall.level).toBe("red");
    expect(overall.metric).toBe("Weight");
    expect(overall.fix).toBeTruthy();
    // the per-metric breakdown is also returned
    expect(metrics.map((m) => m.key).sort()).toEqual(["fcr", "mortality", "weight"]);
  });

  it("is green overall when every metric is on track", () => {
    const { overall } = evaluatePlacement({ day: 28, weightG: 1600, cumMortPct: 1.0, fcr: 1.27 }, ctx);
    expect(overall.level).toBe("green");
  });
});
