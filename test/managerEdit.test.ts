import { describe, it, expect } from "vitest";
import { getHouseDailyEntries, getEditLog, submitManagerEdit } from "@/lib/data";

/**
 * Maker-checker: a manager correction must be attributed (an audit record with
 * old→new and who/when) AND cascade — editing a day's mortality re-derives the
 * cumulative chain for every later day of that house.
 */
describe("submitManagerEdit (manager corrections + audit trail)", () => {
  it("records the change and re-derives the cumulative chain forward", async () => {
    const before = await getHouseDailyEntries("h1");
    // Pick a mid-cycle day so there are later days to cascade into.
    const target = before[5];
    const later = before[before.length - 1];
    const oldDayMort = target.dayMortality;
    const oldCum = target.cumMort;
    const oldLaterCum = later.cumMort;
    const oldLaterRemaining = later.birdsRemaining;

    const { records } = await submitManagerEdit({
      entityId: target.id,
      editor: { id: "u_manager", name: "Thandi", role: "manager" },
      changes: { dayMortality: oldDayMort + 10 },
      note: "Re-counted the morning round",
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      field: "dayMortality",
      oldValue: oldDayMort,
      newValue: oldDayMort + 10,
      editedByRole: "manager",
      editedByName: "Thandi",
    });

    const after = await getHouseDailyEntries("h1");
    const editedDay = after[5];
    const editedLater = after[after.length - 1];
    expect(editedDay.dayMortality).toBe(oldDayMort + 10);
    expect(editedDay.mortality).toBe(editedDay.dayMortality + editedDay.nightMortality);
    expect(editedDay.cumMort).toBe(oldCum + 10);
    // The cascade: every later day carries the +10, with fewer birds remaining.
    expect(editedLater.cumMort).toBe(oldLaterCum + 10);
    expect(editedLater.birdsRemaining).toBe(oldLaterRemaining - 10);

    const log = await getEditLog(target.id);
    expect(log[0].note).toBe("Re-counted the morning round");
  });

  it("ignores a no-op edit (value unchanged → no record)", async () => {
    const entries = await getHouseDailyEntries("h2");
    const e = entries[3];
    const { records } = await submitManagerEdit({
      entityId: e.id,
      editor: { id: "u_manager", name: "Thandi", role: "manager" },
      changes: { culls: e.culls },
    });
    expect(records).toHaveLength(0);
  });
});
