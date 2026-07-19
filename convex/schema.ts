import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
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
  // --- Convex Auth (ROADMAP §9 — auth now lives entirely in Convex) ----------
  // `authTables` provides users / authAccounts / authSessions / etc. We override
  // `users` to carry BatchPilot's own fields — the role picked at sign-up and
  // the tenant scope (siteId for growers, contractorId for contractors) — while
  // keeping the auth-required fields and the email/phone indexes the library
  // looks users up by. This is what makes "Convex handles everything backend"
  // true: identity and app data live in one place, no third-party auth service.
  ...authTables,
  users: defineTable({
    // Auth-managed fields (kept as the library expects).
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // BatchPilot profile.
    role: v.optional(v.string()), // "supervisor" | "manager" | "contractor"
    org: v.optional(v.string()),
    siteId: v.optional(v.string()),
    contractorId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

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

  // Per-user dismissed alerts (an overlay on the reactively-derived alerts; the
  // alert itself is never stored). Keyed by house + metric + level so a
  // dismissed alert re-appears when that house's flagged metric or severity
  // changes. Scoped to the signed-in grower's farm.
  dismissedAlerts: defineTable({
    userId: v.string(),
    siteId: v.string(),
    houseId: v.string(),
    metric: v.string(),
    level: v.string(),
    dismissedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_house", ["userId", "houseId"]),

  // --- Onboarding invites (multi-tenant) -------------------------------------
  // A contractor invites supervisor(s) to a farm; a supervisor invites
  // manager(s) to the same farm. When someone signs up with an invited email,
  // the auth hook (convex/auth.ts) matches this row and stamps their role +
  // siteId, then marks it accepted. Email is stored lowercased for matching.
  invites: defineTable({
    email: v.string(),
    role: v.string(), // "supervisor" | "manager"
    siteId: v.string(),
    invitedByUserId: v.string(),
    status: v.string(), // "pending" | "accepted"
    createdAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_site", ["siteId"]),
});
