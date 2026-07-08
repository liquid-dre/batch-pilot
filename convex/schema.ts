import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * BatchPilot Convex schema (ROADMAP §5 / §9 — the database seam).
 *
 * These tables are the backend home of the operational data that `lib/data/`
 * serves as mock today. Each table mirrors a type in `lib/types.ts` field-for-
 * field, and every row keeps the app's own **business id** (`extId` — e.g. "h1",
 * "p1", "batch_zbnh_085") as an indexed field. That preserves the string-id
 * contract the whole UI and seam already speak, so the swap never renames an id.
 * Convex's internal `_id` is used only for relations inside the backend.
 *
 * Static reference data stays in code, NOT here: the Ross 308 curve + overlay
 * (`lib/data/ross308.ts`), the vaccination schedule and the demo users. They are
 * constants, not user data, and both the mock seam and Convex functions import
 * them directly.
 */

const amount = v.object({ amount: v.number(), unit: v.string() });
const treatment = v.object({ name: v.string(), amount: v.number(), unit: v.string() });

export default defineSchema({
  contractors: defineTable({
    extId: v.string(),
    name: v.string(),
    brandTheme: v.optional(v.object({ brand700: v.string(), brand500: v.string() })),
  }).index("by_extId", ["extId"]),

  contracts: defineTable({
    extId: v.string(),
    chickPrice: v.number(),
    feedPricePerKg: v.number(),
    buyBackPerKg: v.number(),
    focPct: v.number(),
  }).index("by_extId", ["extId"]),

  sites: defineTable({
    extId: v.string(),
    name: v.string(),
    farmCode: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    contractorIds: v.array(v.string()),
    // Houses are their own table (mutable via the setup screen); the site keeps
    // the ordered list of house extIds so `SITE.houses` can be rebuilt in order.
    houseIds: v.array(v.string()),
  }).index("by_extId", ["extId"]),

  houses: defineTable({
    extId: v.string(),
    siteId: v.string(),
    name: v.string(),
    capacity: v.number(),
  })
    .index("by_extId", ["extId"])
    .index("by_site", ["siteId"]),

  batches: defineTable({
    extId: v.string(),
    siteId: v.string(),
    contractorId: v.string(),
    cycleNo: v.number(),
    breed: v.string(),
    killDate: v.string(),
    focPct: v.number(),
    contractId: v.string(),
  })
    .index("by_extId", ["extId"])
    .index("by_site", ["siteId"]),

  plannedBatches: defineTable({
    extId: v.string(),
    siteId: v.string(),
    contractorId: v.string(),
    cycleNo: v.number(),
    breed: v.string(),
    placingDate: v.string(),
    killDate: v.string(),
    focPct: v.number(),
    totalPlaced: v.number(),
    allocated: v.boolean(),
  }).index("by_extId", ["extId"]),

  placements: defineTable({
    extId: v.string(),
    batchId: v.string(),
    houseId: v.string(),
    placedCount: v.number(),
    placingDate: v.string(),
    dayCount: v.number(),
  })
    .index("by_extId", ["extId"])
    .index("by_batch", ["batchId"])
    .index("by_house", ["houseId"]),

  dailyEntries: defineTable({
    extId: v.string(),
    placementId: v.string(),
    date: v.string(),
    day: v.number(),
    // entered
    dayMortality: v.number(),
    nightMortality: v.number(),
    mortality: v.number(),
    culls: v.number(),
    feedAddedKg: v.number(),
    feedConsumedKg: v.optional(v.number()),
    tempC: v.optional(v.number()),
    // optional consumables
    charcoal: v.optional(amount),
    vaccines: v.optional(v.array(treatment)),
    medications: v.optional(v.array(treatment)),
    // derived
    cullAndMort: v.number(),
    cumMort: v.number(),
    cumPct: v.number(),
    birdsRemaining: v.number(),
  })
    .index("by_extId", ["extId"])
    .index("by_placement", ["placementId"])
    .index("by_placement_day", ["placementId", "day"]),

  weightEntries: defineTable({
    extId: v.string(),
    placementId: v.string(),
    day: v.number(),
    avgWeightG: v.number(),
    adgG: v.number(),
    growthRatio: v.number(),
    uniformityPct: v.number(),
  })
    .index("by_extId", ["extId"])
    .index("by_placement", ["placementId"]),

  feedDeliveries: defineTable({
    extId: v.string(),
    siteId: v.string(),
    date: v.string(),
    feedType: v.string(),
    bagSizeKg: v.number(),
    bagCount: v.number(),
    netWeightKg: v.number(),
  })
    .index("by_extId", ["extId"])
    .index("by_site", ["siteId"]),

  catchingEvents: defineTable({
    extId: v.string(),
    batchId: v.string(),
    night: v.string(),
    count: v.number(),
    collectionWeightKg: v.optional(v.number()),
  })
    .index("by_extId", ["extId"])
    .index("by_batch", ["batchId"]),

  manifests: defineTable({
    batchId: v.string(),
    heldCount: v.number(),
    vehicles: v.array(v.object({ plate: v.string(), driver: v.string() })),
  }).index("by_batch", ["batchId"]),

  // Attributed manager corrections (maker-checker; ROADMAP §5/§9). Grows as
  // managers correct captured values — one record per changed field, never
  // overwritten. This is the Convex audit table the mock EDIT_LOG stood in for.
  editLog: defineTable({
    extId: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    placementId: v.string(),
    houseId: v.string(),
    houseName: v.string(),
    day: v.number(),
    field: v.string(),
    fieldLabel: v.string(),
    oldValue: v.union(v.number(), v.null()),
    newValue: v.union(v.number(), v.null()),
    editedById: v.string(),
    editedByName: v.string(),
    editedByRole: v.string(),
    editedAt: v.string(),
    note: v.optional(v.string()),
  })
    .index("by_extId", ["extId"])
    .index("by_entity", ["entityId"]),

  // Closed cycles on the site — the single source for the contractor track
  // record and the grower comparison view (their day-by-day curves are still
  // generated deterministically by the seam from these seeds).
  historicalBatches: defineTable({
    cycleNo: v.number(),
    placingDate: v.string(),
    killDate: v.string(),
    finalDay: v.number(),
    finalCumMortPct: v.number(),
    finalWeightG: v.number(),
    finalFcr: v.number(),
    epef: v.number(),
  }).index("by_cycle", ["cycleNo"]),

  // Other growers supplying a contractor (tenant-isolation + generated screens).
  // Their per-house/day-by-day data is generated on demand from these profiles.
  growerProfiles: defineTable({
    siteId: v.string(),
    name: v.string(),
    farmCode: v.string(),
    contractorId: v.string(),
    houseCount: v.number(),
    placedPerHouse: v.number(),
    cycleNo: v.number(),
    status: v.string(),
    age: v.number(),
    growOut: v.number(),
    cumMortPct: v.number(),
    weightFactor: v.number(),
    fcr: v.number(),
    uniformityPct: v.number(),
  })
    .index("by_siteId", ["siteId"])
    .index("by_contractor", ["contractorId"]),
});
