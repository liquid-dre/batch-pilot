# BatchPilot — Product Roadmap & Build Context

> **Read this file first, before any work.** It is the single source of truth for the build.
> As you complete items in §8, change `[ ]` → `[x]` and add a one-line note. If reality diverges
> from this file, update the file — don't let it go stale. Future agents (and humans) rely on it
> to know where we are, where we came from, and where we're going.

---

## 1. What BatchPilot is

BatchPilot is a WhatsApp-native operations layer for broiler (meat-chicken) farming in Zimbabwe.
It connects two groups:

- **Growers / farm supervisors** — rear the chickens; today they post a daily hand-tallied update
  per house into a WhatsApp group.
- **Contractors** (e.g. Irvine's) — supply chicks, feed and vaccines, then collect the grown birds.

BatchPilot turns each day's raw figures into **auto-computed cumulatives**, a **green / amber / red
status** per house against a breed benchmark, and **projections** (will the flock hit target weight
by the contractor's kill date?), plus the prescriptive "what to do next."

**The wedge:** supervisors hand-calculate cumulative mortality, cum %, and a whole site-average block
every morning across six houses. BatchPilot does that maths for them and adds the analytics on top.

---

## 2. Where we've come from (context the agent must respect)

This product is grounded in real field data, not guesses. Decisions already validated:

- **Per-house, per-day is the unit.** A site has several houses (the reference site, "Nhunge," has 6 ×
  ~16,000 birds). A batch can be **split across houses with staggered placing dates** (Houses 1–2 a day
  ahead of 3–6), so each house tracks its **own day-count**.
- **The benchmark is Ross 308** (as-hatched) performance objectives — target weight, daily gain, ADG,
  feed intake, FCR per day. Mortality/uniformity bands are a **contractor overlay** on top.
- **Projections measure against the contractor's kill date**, which is set up front in the cycle-planning
  message (not a fixed grow-out length).
- **Feed has two meanings** — *added to a house* vs *consumed*. They differ (we've seen 190 g/bird/day
  reported, which is a bin refill, not consumption). FCR/intake scoring needs the consumed figure.
- **Temperature is diagnostic, not a benchmark** — captured optionally, surfaced as a likely *cause*
  when weight/mortality go off (Ross guidance: keep <21 °C from day 21).
- **Status is never colour alone:** colour + icon + word + shape, so it survives glare and colour-blindness.
- **The competitor is a WhatsApp group**, so the product must feel like *less* work than typing the
  message does today. WhatsApp ingestion (1:1, via Twilio) is a later phase; the data model is built
  channel-agnostic so it can plug in.

Reference data shipped with the repo: `ross308_as_hatched_benchmark.csv` (the breed curve) and the
brand guideline PDF (visual system). Use them.

---

## 3. Where we are now (this build)

Going from an empty Next.js project to a **beautiful, clickable, architecturally-clean MVP prototype**
that demonstrates both the grower and contractor experiences.

- **Data is hardcoded** (mock), not a database — but accessed through a seam (see §5) so a real backend
  drops in later without touching the UI.
- **No authentication yet** — a role switcher stands in for login.
- **No payments yet.**
- The bar is: it should look and feel like a shipped Apple-grade product, on our brand, and be
  structured so Convex (DB), Clerk (auth) and Stripe (billing) slot in cleanly.

---

## 4. Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- Fonts via `next/font`: **Plus Jakarta Sans** (display/headings), **IBM Plex Sans** (body/UI),
  **IBM Plex Mono** (numbers/metrics)
- Charts: Recharts (or hand-built SVG where cleaner)
- Motion: Framer Motion and/or CSS, directed by the installed design skills
- **Installed Claude Code design skills to use on every UI task:** `emil-kowalski-design` (motion &
  interaction), `ui-ux-pro`, `impeccable`. Lean on them hard — the goal is beautiful and *distinctive*,
  not a default template.
- **Planned later (do not build now, but leave the seams):** Convex (DB + realtime), Clerk (auth),
  Stripe (billing), Twilio (WhatsApp).

---

## 5. Architecture principles — build for the swap

Everything that will later become "real" is hidden behind a seam now, so swapping mock → real is a
one-module change and the UI never has to be rewritten.

- **Data-access seam.** All reads/writes go through typed functions in `lib/data/` (e.g.
  `getActiveBatches()`, `getHouseDailyEntries(houseId)`, `submitDailyUpdate(input)`). They return
  hardcoded data today; they become Convex queries/mutations later. **UI components never import mock
  data directly** — only these functions.
- **Types are the contract.** `lib/types.ts` defines the data model (§7). Mock data and future Convex
  both conform to it.
- **Auth seam.** `useCurrentUser()` (and an `<AuthProvider>`) returns a hardcoded user + role now →
  Clerk later. Because there's no login, a visible **role switcher** in the app shell toggles
  Grower ↔ Contractor for the demo.
- **Billing seam.** `usePlan()` returns a stub plan now → Stripe later.
- **Theming seam.** Every brand value is a CSS custom property in `globals.css`. Components reference
  **semantic tokens** (`--color-primary`, `--status-bad`…), never raw hex. Re-theming = editing
  `globals.css` only.
- Keep mock-data calls simple/synchronous where possible, but type them as if async, so the Convex swap
  is mechanical.

---

## 6. Design system & brand

**Aesthetic:** Apple-clean — generous whitespace, restraint, crisp type hierarchy, subtle depth,
purposeful motion — expressed through the **BatchPilot brand**, never generic SaaS. Two registers:

- **Grower / supervisor screens:** spacious, calm, large touch targets, one clear action per screen
  ("what now?" before any chart). Built for one thumb, bright sun, a cheap Android.
- **Contractor screens:** denser and data-forward, but still clean and uncluttered.

**Identity:** mark = two ascending chevrons; wordmark = **BatchPilot**; palette and type per the brand
guideline PDF. Brand colour is **Horizon blue** and must stay clear of the green/amber/red status system.

**Define these in `globals.css` (raw scale + semantic aliases):**

```css
:root{
  /* Brand — Horizon (themeable) */
  --brand-900:#0B2A4A; --brand-700:#14487E; --brand-600:#1A5B9C;
  --brand-500:#2474C4; --brand-100:#DCEAF7; --brand-50:#EEF5FC;
  /* Neutrals — warm grey (fixed) */
  --ink:#1B1E23; --slate:#44474E; --muted:#6B6F76; --hint:#9499A1;
  --border:#C9CDD3; --divider:#E4E7EA; --paper:#F4F2ED; --surface:#FFFFFF;
  /* Status — reserved, never used for branding */
  --status-good:#1F7A3D; --status-warn:#C77800; --status-bad:#C62828;
  --status-good-tint:#E3F2E8; --status-warn-tint:#FAF0DC; --status-bad-tint:#FAE4E4;
  /* Semantic aliases — components use THESE */
  --color-primary:var(--brand-700); --color-primary-hover:var(--brand-600);
  --color-accent:var(--brand-500); --color-bg:var(--paper); --color-surface:var(--surface);
  --color-text:var(--ink); --color-text-muted:var(--muted); --color-border:var(--divider);
  /* Type */
  --font-display:'Plus Jakarta Sans'; --font-body:'IBM Plex Sans'; --font-mono:'IBM Plex Mono';
  /* Radii / spacing / motion */
  --radius-card:16px; --radius-control:10px; --radius-pill:999px;
  --space-unit:4px; --shadow-card:0 1px 2px rgba(11,42,74,.06),0 4px 16px rgba(11,42,74,.05);
  --ease-out:cubic-bezier(.16,1,.3,1); --dur-fast:140ms; --dur:220ms;
}
```

**Type scale (mobile-first):** Display 32/700 · H1 26/700 · H2 21/600 · H3 18/600 · Body-L 17/400 ·
Body 15/400 · Label 14/500 · Data 15/500 (mono, tabular figures). Body never below 15px; anything
tappable ≥ 16px.

**Non-negotiable rules:**
- Status = **colour + icon + word + shape** (`✓`/`△`/`!` and `●`/`▲`/`■`). Never colour alone.
- Brand colour is never green/amber/red.
- WCAG 2.1 AA contrast; grower tap targets ≥ 48px (use 52–64px); numbers in mono with tabular figures.
- Numeric entry on grower screens uses a **big +/− stepper**, not a raw keyboard.

---

## 7. Data model (the contract — `lib/types.ts`)

```
Contractor   { id, name, brandTheme? }
Grower/Site  { id, name, farmCode, location{lat,lng}, contractorIds[], houses[] }
House        { id, siteId, name, capacity }
Batch/Cycle  { id, siteId, contractorId, cycleNo, breed, killDate, focPct, contractId }
Placement    { id, batchId, houseId, placedCount, placingDate, dayCount }   // per-house age
DailyEntry   { id, placementId, date, day, mortality, culls, feedAddedKg, feedConsumedKg?, tempC?,
               // derived: cullAndMort, cumMort, cumPct, birdsRemaining }
WeightEntry  { id, placementId, day, avgWeightG, adgG, growthRatio, uniformityPct }
FeedDelivery { id, siteId, date, feedType, bagSizeKg, bagCount, netWeightKg }   // nominal vs net
CatchingEvent{ id, batchId, night, count, collectionWeightKg? }
BenchmarkSet { contractorId, breed, sex, unit, curve:[{day,weightG,dailyGainG,avgDailyGainG,
               dailyIntakeG,cumIntakeG,fcr}], overlay:{mortalityBand[],uniformityTarget[]} }
Contract     { id, chickPrice, feedPricePerKg, buyBackPerKg, focPct }
Status       { metric, level:'green'|'amber'|'red', actualVsTarget, cause?, fix? }
```

Seed `BenchmarkSet.curve` from `ross308_as_hatched_benchmark.csv`. Seed mock sites/batches from the
Nhunge cycle-85 figures so the demo shows realistic numbers (the day-27/28 houses run ~13% under the
Ross weight curve — that under-performance is the hero story, keep it).

---

## 8. MVP feature list & status

**Phase 0 — Foundation**
- [ ] Scaffold Next.js (App Router, TS, Tailwind); install deps; load the three fonts
- [ ] `globals.css` with full token set (§6); Tailwind wired to the CSS variables
- [ ] Data-access seam (`lib/data/`) + `lib/types.ts` + mock data seeded from Nhunge + Ross 308
- [ ] Auth/role stub (`useCurrentUser`, `<AuthProvider>`) + billing stub (`usePlan`)
- [ ] UI primitives: Button, Card, StatusPill, Input, Stepper, Table, Alert/Callout, Toast
- [ ] App shell: top bar with BatchPilot mark + **role switcher (Grower / Contractor)**, nav

**Phase 1 — Grower experience**
- [ ] Daily update form (per house: mortality, culls, feed added kg, optional temp) → auto-computes
      cull&mort, cum mort, cum %, birds remaining, site average; **echo-back confirmation** before save
- [ ] Feed delivery form (type, bag size, bag count, weighed net) + nominal-vs-net reconciliation flag
- [ ] Weights form (avg g, ADG, growth ratio, uniformity)
- [ ] House status cards (green/amber/red, with icon+word+shape) + site rollup
- [ ] Projection card: countdown + verdict vs the contractor **kill date**
- [ ] Alerts list with cause & fix

**Phase 2 — Contractor experience**
- [ ] Portfolio dashboard: all active batches, status, projected-ready vs kill date, ranking (EPEF)
- [ ] Per-grower drill-down: per-house detail, trends, track record
- [ ] Flock-overview data table (dense, mono numbers, status pills)
- [ ] Collection/catching schedule + vehicle manifest view
- [ ] Benchmark view: Ross curve + contractor overlay

**Phase 3 — Analytics engine**
- [ ] Rule-based status engine vs Ross 308 (thresholds configurable; see brand doc for default bands)
- [ ] Weight-curve chart: actual per house vs Ross objective (the Nhunge ~13%-under hero view)
- [ ] FCR / efficiency + feed-added-vs-consumed flags
- [ ] Causes-&-fixes lookup keyed by metric + growth phase

**Phase 4 — Polish**
- [ ] Motion: page/route transitions, status-pill and toast micro-interactions (emil-kowalski-design)
- [ ] Empty, loading and error states for every surface
- [ ] Responsive + true mobile pass (grower flow on a phone)
- [ ] Accessibility pass (AA, focus rings, 48px targets, status never colour-only)

---

## 9. Explicitly deferred (post-MVP) — and the seam each will use

- **Auth → Clerk** — seam: `<AuthProvider>` / `useCurrentUser()`
- **Database + realtime → Convex** — seam: `lib/data/*`
- **Payments → Stripe** — seam: `usePlan()`
- **WhatsApp ingestion → Twilio** — 1:1 messaging to a BatchPilot number, tolerant parser + echo-back
  (the data model is already channel-agnostic for this)
- **Offline / PWA, native app, ML projections** — later phases

Do **not** build these now. Just don't paint us into a corner that blocks them.

---

## 10. How to use this file (for the agent)

1. Read §1–§7 before writing code so your choices match the product and brand.
2. Work one phase at a time, top to bottom.
3. As each item completes, set `[x]` and append `— <one-line note: file/decision>`.
4. If you make an architectural decision, record it under the relevant section.
5. Never hardcode a colour or font in a component — use the tokens in `globals.css`.
6. Use the `emil-kowalski-design`, `ui-ux-pro` and `impeccable` skills on every UI task.
