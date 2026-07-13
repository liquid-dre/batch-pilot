import { describe, it, expect } from "vitest";
import { group, clean, reformat } from "@/components/ui/Stepper";

/**
 * The comma-grouping + caret math is the tricky, bug-prone part of the numeric
 * entry (the +/- stepper and clamp/round are exercised via the UI). These are
 * pure, so they're covered here without a DOM.
 */

describe("group — comma-grouping the integer part", () => {
  it("groups thousands", () => {
    expect(group("4000")).toBe("4,000");
    expect(group("16000")).toBe("16,000");
    expect(group("120000")).toBe("120,000");
    expect(group("1234567")).toBe("1,234,567");
  });

  it("leaves small numbers untouched", () => {
    expect(group("0")).toBe("0");
    expect(group("7")).toBe("7");
    expect(group("999")).toBe("999");
  });

  it("keeps the decimal part ungrouped (FCR / temp)", () => {
    expect(group("1.2")).toBe("1.2");
    expect(group("22.5")).toBe("22.5");
    expect(group("1234.56")).toBe("1,234.56");
    expect(group("1200.")).toBe("1,200."); // trailing dot mid-type
  });
});

describe("clean — strip commas/letters back to a numeric string", () => {
  it("drops the grouping commas so the emitted value stays numeric", () => {
    expect(clean("4,000")).toBe("4000");
    expect(clean("120,000")).toBe("120000");
    expect(Number(clean("1,234.5"))).toBe(1234.5);
  });

  it("keeps only the first decimal point", () => {
    expect(clean("1.2.3")).toBe("1.23");
  });

  it("returns empty for a blank field (blank ⇒ 0 at the call site)", () => {
    expect(clean("")).toBe("");
  });
});

describe("reformat — grouped text + caret position after a keystroke", () => {
  it("a fresh keystroke into an empty field is replaced, not appended (4 → 4)", () => {
    // blankZero opens the field empty, so the browser value after typing "4" is "4".
    expect(reformat("4", 1)).toEqual({ text: "4", caret: 1 });
  });

  it("groups as you type and moves the caret past the inserted separator", () => {
    // typing the 4th digit of "4000": caret was at 4, "4,000" pushes it to 5.
    expect(reformat("4000", 4)).toEqual({ text: "4,000", caret: 5 });
  });

  it("preserves the caret when inserting a digit mid-number", () => {
    // display "4,000", caret after the "4" (pos 1); type "9" → raw "49,000", caret 2.
    expect(reformat("49,000", 2)).toEqual({ text: "49,000", caret: 2 });
  });

  it("keeps a blank field blank", () => {
    expect(reformat("", 0)).toEqual({ text: "", caret: 0 });
  });
});
