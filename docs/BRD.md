# Business Requirements Document — Broiler Grower Management Platform

**Working name:** Coopilot (shortlist & rationale in §8)
**Version:** 0.4
**Date:** 13 June 2026
**Author:** [Your name]
**Status:** Draft for cofounder review — grounded in real field data from an active Irvine's grower (Nhunge, cycle 85) — see §7

> Changes since v0.3: added the cycle-planning message as the batch-creation source (with staggered placing dates, target kill date, chargeable count, 1% FOC, house split); added phased night-catching/collection handling and progressive batch close; added a collection manifest / gate-verification feature from the vehicle+driver list; made temperature an optional, diagnostic-only per-house field; decoded the identifier (farm code + cycle number); corrected cycle length to contractor-set per cycle.

---

## 1. Executive summary

Broiler growers in Zimbabwe rear chickens for contractors (Irvine's, Drummonds, Surrey, Koala, etc.) who supply chicks, feed, and vaccines, then collect ("catch") the birds and pay per kilogram. **Today the workflow runs in a WhatsApp group** shared between the farm supervisor, the farm owner, and the contractor's supervisor and team. Each cycle, the contractor posts a planning table (placing dates, target kill date, counts, houses); the supervisor posts a daily hand-tallied mortality/feed update per house, confirms feed deliveries by weighing them, and posts periodic weights; and at the end the contractor posts a night-by-night catching schedule and a list of authorised collection vehicles. The cumulative maths and benchmark comparison are done manually or not at all.

Coopilot replaces the typing and hand-maths with structured capture, **auto-computes every cumulative and site rollup**, and turns the data into **prescriptive analytics**: a traffic-light status (green / yellow / red), projections (harvest date vs the contractor's kill date, final weight, FCR, grower margin), and recommended actions. It is designed to slot into the existing WhatsApp habit rather than fight it.

Delivered first as a mobile-friendly web app (Next.js + Convex on Vercel) with offline-capable capture, then a native mobile app and a WhatsApp entry path.

---

## 2. Problem statement

The core problem is **digitisation and atomisation** of a manual, WhatsApp-based, trust-light process.

- The supervisor hand-tallies cumulative mortality, cumulative %, cull-and-mort totals, birds remaining and a site-average block **every morning across six houses** — slow and error-prone.
- Growers can't tell in real time whether the flock will hit target weight by the contractor's **kill date** — by the time underperformance shows, the margin is lost.
- WhatsApp messages scroll away: no structured history, trend, track record, or analytics.
- Feed deliveries are weighed and reported informally; nominal-vs-net discrepancies are caught by eye, if at all.
- Collection is a multi-night logistics event (counts per night, authorised trucks) with no structured record or settlement view.
- Contractors see the raw posts but have no portfolio rollup, ranking, projection, or collection schedule across growers.

---

## 3. Goals & objectives

**Primary goals**
- Let the supervisor enter only raw numbers; **Coopilot does all cumulative and rollup maths automatically.**
- Give growers a real-time, benchmark-aware view of every house, measured against the contractor's kill date.
- Give contractors a portfolio view to plan placing/collection, forecast yield, prioritise growers, and detect supply problems.
- Fit the existing WhatsApp workflow; make capture fast, reliable (works offline), and verifiable (toggleable maker-checker).

**Candidate success metrics**
- Time saved per daily update vs the current hand-tallied WhatsApp message.
- % of active houses with complete daily entries.
- Forecast accuracy of projected ready-date vs the contractor kill date (in days).
- Reduction in average cumulative mortality vs benchmark; improvement in FCR/ADG/uniformity/EPEF.
- % of feed deliveries reconciled (nominal vs weighed net); % of collections logged against the manifest.

---

## 4. Stakeholders, roles & personas

| Role | Who | Core needs |
|---|---|---|
| **Platform Admin** | You / dev team | Onboard contractors, manage breeds/benchmark templates, config, theming |
| **Contractor Org Admin** | Irvine's, Drummonds, etc. | Plan cycles, manage growers & benchmarks, portfolio analytics, supplies, catching |
| **Contractor Field/Supervisor + team** | Irvine's staff in the group | See each site's live data, support growers, run collection |
| **Grower (Owner)** | the farm owner (e.g. her mom) | Oversee/approve entries (checker, if enabled), see analytics & projected margin, manage houses & supervisors |
| **Farm Supervisor** | On-site staff posting updates | Capture daily updates, deliveries, weights, temperature; verify collection trucks (maker) |

---

## 5. Proposed solution (high level)

A multi-tenant, white-label-ready web application where:

- **Contractors** create a cycle from their planning data (placing dates, kill date, counts, FOC, house split), import per-breed benchmarks, announce feed dispatches, and post the catching schedule and vehicle manifest.
- **Farm supervisors** capture structured updates mirroring today's WhatsApp messages — daily mortality/feed per house, feed-delivery confirmation, periodic weights, optional temperature — typing only raw numbers while the app computes every cumulative and the site rollup, compares to benchmark, and produces a green/yellow/red status with recommended fixes. Capture is offline-capable.
- **Growers/owners** see status and projections per house and per site, track record, and projected margin, and verify collection trucks against the manifest.
- **Contractors** see their own batches only (even on a shared grower) plus portfolio tools: placing/collection schedule, ranking, optimum-batch-size, and feed reconciliation.

MVP analytics are **rule-based and explainable**; ML projections come later.

---

## 6. Key domain concepts & glossary

- **Cycle:** the contractor's numbered production round for a farm (e.g. **cycle 85**). The grower/site identifier encodes it: `ZBNH/085` = farm code **ZBNH** (Nhunge) + cycle **85**.
- **Grower / Site / Farm:** the physical site (one record per real farm), with a contractor farm code. Profile: name, location/geo, houses, capacity per house (e.g. Nhunge = 6 × 16,000).
- **House:** a chicken house with a stocking capacity.
- **Batch (= a cycle on a site):** supplied by one contractor; spans one or more houses with **staggered placing dates** (Nhunge cycle 85: Houses 1–2 placed Fri 15 May, Houses 3–6 placed Sat 16 May).
- **Placing date / Kill date:** placing = chicks in; **kill date = the contractor's target collection date**, set up front in the planning message (cycle 85: ~31 days, 15 May → 15/16 Jun). Actual catching happens around (usually just before) the kill date.
- **FOC (free of charge):** the contractor includes ~**1%** of birds free as a mortality buffer; the chargeable count is quoted "excl 1% FOC". Affects placed count and margin.
- **Placement (House age):** per house — placed count + its own placing date / day count.
- **Contract (per batch):** chick price, feed price, input prices, buy-back price/kg, **FOC %**. Drives margin.
- **Benchmark set:** per-contractor, per-breed targets imported from CSV — target weight/day, ADG, uniformity, cumulative feed, FCR, cum-mortality band, vaccination schedule.
- **Daily update (per house, per day):** raw inputs — mortality, culls, feed (kg), optional temperature; optional AM/PM split. App auto-computes Cull & Mort, Cum Mort, Cum %, Birds Remaining, Site Average; optional site chlorine (ppm).
- **Feed delivery:** feed type/phase (e.g. Broiler Finisher Pellet), bag size, bag count, weighed net weight (kg); auto nominal-vs-net reconciliation.
- **Weights (periodic, per house):** avg weight (g), ADG (g/day), growth ratio/index, uniformity %.
- **Catching / collection:** end-of-cycle, done at night over multiple nights with per-night bird quotas; draws down birds remaining; collection weights drive settlement.
- **Collection manifest:** contractor-issued list of authorised vehicles (plate) + drivers + total birds held for a catching round; used for gate verification and biosecurity.
- **Temperature:** measured per house, mainly operational; **diagnostic-only** — surfaced as a candidate cause when a mortality alert is yellow/red, not a benchmarked metric.
- **Downtime / breathing period:** ~2 weeks between kill date and next placing for clean-up and prep (drives cycle cadence and capacity planning).
- **Culls vs mortality:** culls = birds deliberately removed; mortality = natural deaths; summed as Cull & Mort.
- **FCR / EPEF:** derived efficiency and composite KPIs.
- **Maker-checker:** supervisor (maker) → owner (checker). Toggleable per grower; current practice ≈ off.

---

## 7. Sample information — real field data (Nhunge, Irvine's, cycle 85)

Actual WhatsApp messages and documents, reproduced as-is. MVP capture/flows map 1:1 to these. Dashes used as separators ("Day -27") are formatting, not negatives.

### 7.1 Cycle planning message (batch-creation source)

> "Please find placing information for cycle 85 below."

| FARM NAME | PLACING DATE | KILL DATE | EXCL 1% FOC | HOUSE CAPACITIES |
|---|---|---|---|---|
| Nhunge | Friday, 15 May 2026 | Monday, 15 June 2026 | 32000 | 2 × 16000 |
| Nhunge | Saturday, 16 May 2026 | Tuesday, 16 June 2026 | 64000 | 4 × 16000 |

Two rows = staggered placing (2 houses, then 4). Total 6 houses / 96,000 capacity. **Kill date** = target collection; **excl 1% FOC** = chargeable count excludes a 1% free allowance. → Creates the batch: cycle no., per-house placing dates & day-counts, target kill date, counts, FOC%.

### 7.2 Daily mortality + feed update (morning, per house + site average)

```
GOOD MORNING · ZBNH /085 · DATE 12/06/26 · Mortality Update
Day 27  House 1  Placed 16153  Mort 17  Culls 0  Cull&Mort 17  CumMort 296  Cum% 1.83%  Feed 2350kg
Day 27  House 2  Placed 16156  Mort 16  Culls 0  Cull&Mort 16  CumMort 298  Cum% 1.84%  Feed 2600kg
Day 26  House 3  Placed 16153  Mort 18  Culls 0  Cull&Mort 18  CumMort 530  Cum% 3.28%  Feed 2350kg
Day 26  House 4  Placed 16156  Mort 8   Culls 0  Cull&Mort 8   CumMort 273  Cum% 1.68   Feed 2350kg
Day 26  House 5  Placed 16139  Mort 19  Culls 0  Cull&Mort 19  CumMort 355  Cum% 2.19   Feed 2450kg
Day 26  House 6  Placed 16146  Mort 30  Culls 0  Cull&Mort 30  CumMort 368  Cum% 2.27   Feed 3000kg
Site Average  Placed 96903  Remaining 94783  CumMort 2120  Mort% 2.18  Chlorine 3ppm
```
**Typed:** day, house, mortality, culls, feed kg, chlorine (+ optional temperature). **Auto-computed:** Cull & Mort, Cum Mort, Cum %, Birds Remaining, Site Average.

### 7.3 Feed delivery confirmation (weighed on arrival)

```
GOOD AFTERNOON · Feed Delivery Update · Date 11/06/26
Received: Broiler Finisher Pellet 50kg — 300 Bags · Net weight 14820kg
```
300 × 50 = 15,000kg nominal vs **14,820kg** net → 180kg shortfall (~1.2%), flagged automatically.

### 7.4 Periodic weights update (weigh-day, per house)

```
Day 28 weights
Hse 1  Weight 1401g  ADG 98g  Growth ratio 1.2  Uniformity 73%
Hse 2  Weight 1417g  ADG 89g  Growth ratio 1.2  Uniformity 70%
```

### 7.5 Catching / collection notification (phased, at night)

```
Good morning all · Here is the catching information for the flock
Sunday night  — 34664
Monday night  — 52000
Tuesday night — 7672 (or the balance)
"let me know if you still need feed"
```
Collection is staged over nights with per-night quotas (~94,336 total). Birds eat until caught, so feed need is checked against the schedule. → Drives the collection flow, progressive batch close, and settlement.

### 7.6 Collection manifest — authorised vehicles & drivers

> Header: **"NHUNGE HOLDS 47 248"** (birds held for this catching round)

`588 AHE 1586 MUKUDZEYI · 588 ACZ 4465 JOEL · 588 ACZ 4462 FRANCIS · 558 AHE 1585 BAZIL · 539 AFJ 9166 LIFE · 519 AEZ 8839 LLOYD · 594 AAS 2375 GILBERT · 588 AGJ 0828 BANDA · 600 AEG 4578 MKANJARI · 270 ABP 7648 MOSES · 474 AGY 9861 TANATSWA`

A list of authorised trucks (plate) + drivers for the round. → Gate-verification checklist for the supervisor; biosecurity and traceability. *(47,248 ≈ half the on-site birds, so likely one night's round — confirm.)*

### 7.7 Temperature (diagnostic)

Measured per house, mainly for the farm team. Only discussed when mortality is high and looks temperature-driven (too hot / too cold). → Optional per-house capture; surfaces as a candidate cause in mortality alerts, not a benchmark.

---

## 8. Naming — shortlist & rationale (for cofounder discussion)

**Recommendation: Coopilot.** Puts the promise in the name — a co-pilot guiding the batch — and the coop/copilot pun is memorable and brandable. Risk: "copilot" is overused in tech.

| Name | Why it works | Watch-out |
|---|---|---|
| **Coopilot** *(pick)* | "Co-pilot for the coop." Prescriptive/guidance core; playful, brandable. | "Copilot" heavily used in tech. |
| **FlockWise** | "Wise about your flock." Insight & trust; professional. | Slightly generic. |
| **BatchPilot** | Centers the batch + guidance; operationally precise. | Utilitarian/B2B. |
| **GrowGauge** | "Gauge" = measure vs benchmark; ties to growers. | Could read generic agri. |
| **PoultryPulse / YieldBridge / BroodIQ** *(alts)* | Monitoring vibe / grower↔contractor link / poultry-jargon punch. | Less distinctive / corporate / niche. |

---

## 9. Use cases

**Contractor**
- UC-C1: Create a cycle from planning data (cycle no., staggered placing dates, kill date, counts, FOC%, house split) → auto-builds houses & day-counts.
- UC-C2: Onboard grower + farm profile (houses, capacities, location, farm code).
- UC-C3: Import/edit benchmark sets per breed via CSV.
- UC-C4: Announce a feed dispatch; see weighed confirmation/discrepancy.
- UC-C5: View own batches' live status, trends, projections vs kill date; track record.
- UC-C6: Portfolio: placing/collection schedule, ranking, optimum-batch-size.
- UC-C7: Issue the catching schedule and vehicle manifest.

**Farm supervisor / grower**
- UC-G1: Post the daily update per house (mortality, culls, feed kg, optional temp) — app computes the rest.
- UC-G2: Confirm a feed delivery (type, bags, bag size, weighed net); see discrepancy.
- UC-G3: Post weights on weigh-days (avg g, ADG, growth ratio, uniformity).
- UC-G4: View status per house & site; projection vs kill date; causes & fixes (incl. temperature when mortality is high).
- UC-G5: Verify arriving trucks against the collection manifest; record per-night catching.
- UC-G6: Share a formatted summary back to the WhatsApp group.
- UC-G7: View own track record across cycles.

---

## 10. User flows

**10.1 Cycle/batch setup** — Contractor enters/creates cycle from the planning table → app builds the houses, per-house placing dates and day-counts, target kill date, counts and FOC, and attaches the breed benchmark curve.

**10.2 Daily update** — Supervisor enters mortality, culls, feed kg (and optional temperature) per house, chlorine once → app computes all cumulatives + site rollup, recalculates status and projections, saves locally and syncs → optional "Share to WhatsApp".

**10.3 Feed delivery** — Contractor announces dispatch → supervisor weighs on arrival and enters type/bags/bag-size/net weight → app reconciles net vs nominal, updates feed-on-hand and days-remaining.

**10.4 Weights (weigh-day)** — Supervisor enters per-house weight/ADG/growth ratio/uniformity → app compares to curve, updates weight projection and projected ready-date vs kill date.

**10.5 Collection / catching** — Contractor posts the night schedule + manifest → supervisor verifies trucks at the gate, records birds caught per night (drawing down remaining) and collection weights → batch closes progressively → settlement view (kg × price − inputs) → cycle added to track record. App also flags "feed still needed?" against the catching schedule.

**10.6 Contractor portfolio** — Active batches with status and projected ready-date vs kill date; sort/filter; drill into per-house detail; placing/collection calendar incl. ~2-week downtime windows.

---

## 11. Alert & analytics logic (MVP)

**Auto-computation (day-one win):** Cull & Mort, Cum Mort, Cum %, Birds Remaining, Site Average, running FCR, weight-curve position — all derived from raw inputs.

**Status engine (rule-based, transparent), per house and rolled up per site:** compare each metric (weight/ADG/uniformity vs curve, cumulative mortality, FCR, feed consumption) to the benchmark band for the current day/phase → green / yellow / red.

**Causes & fixes (curated lookup, per metric + phase):** e.g. high early mortality → brooding **temperature** (prompt the supervisor's temp reading) / chick quality / water access; weight below target → feed, FCR, heat stress, disease; low uniformity → feeder/drinker access, density; feed-on-hand low vs days-remaining → supply shortfall.

**Projections (MVP — formula-based, explainable):** projected ready-date vs **contractor kill date**; final weight, FCR; **grower margin** = (projected total kg × price/kg) − inputs, accounting for **FOC**. *ML deferred.*

---

## 12. MVP feature list

**A. Accounts, roles & multi-tenancy** — RBAC; strict per-contractor isolation on a shared grower.

**B. Onboarding & profiles** — Admin → contractors; contractor → growers + farm profile (houses, capacity, location, **farm code**); grower → supervisors.

**C. Cycle & batch management** — create a cycle/batch from planning data: cycle number, **staggered per-house placing dates & day-counts**, **target kill date**, chargeable count + **FOC %**, house allocation; per-house and per-site timelines.

**D. Benchmark management (CSV import)** — per-contractor sets per breed (weight, ADG, uniformity, cum-feed, cum-mortality band, vaccination schedule). *Needs a real sample CSV — §14.*

**E. Capture — forms mirroring the WhatsApp messages (offline-capable)**
- **E1 Daily update:** per house — mortality, culls, feed (kg), **optional temperature**, optional AM/PM split; site chlorine. Auto-computes all cumulatives + rollup.
- **E2 Feed delivery:** type/phase, bag size, bag count, weighed net weight; nominal-vs-net reconciliation.
- **E3 Weights (weigh-day):** avg weight (g), ADG, growth ratio, uniformity per house.

**F. Maker-checker (toggleable, default off)** — per-grower; on: submit → approve/reject + audit trail.

**G. Status & alerts engine** — green/yellow/red per house & site; deviation from benchmark; curated causes & fixes (temperature included as a mortality cause).

**H. Analytics dashboards** — *Grower:* status per house & site, benchmark comparison, projection vs kill date, estimated margin, track record. *Contractor (own batches only):* portfolio with projected ready-date vs kill date; per-grower drill-down; trends; ranking; placing/collection schedule; optimum-batch-size.

**I. Feed dispatch & receipt reconciliation** — announce → weighed confirm → discrepancy; feed-on-hand + days-remaining; lead-time.

**J. Collection / catching** — record the per-night catching schedule and counts; draw down birds remaining; capture collection weights; progressive batch close; settlement view; "feed still needed?" prompt.

**K. Collection manifest & gate verification (lightweight)** — display the contractor's authorised vehicle+driver list and held count; supervisor ticks off arriving trucks. Biosecurity/traceability.

**L. Projections** — ready-date vs kill date, final weight, FCR, grower margin (FOC-aware), formula-based.

**M. Share-to-WhatsApp summary** — one-tap formatted daily summary to post into the existing group.

**N. Notifications** — in-app for MVP.

**O. Farm map view** — contractor sees their growers as pins. Lightweight.

**P. White-label theming** — branding is configuration, not code, per tenant.

---

## 13. Future features (post-MVP roadmap)

- **WhatsApp two-way integration** (top priority) — parse the supervisor's existing messages into entries and/or a bot for conversational capture.
- Native mobile app; broader offline.
- ML projections, anomaly detection, computer-vision weight estimation.
- IoT/sensors: temperature, humidity, ammonia, water meters, chlorine dosing.
- Capacity/scheduling engine using cycle cadence + downtime; optimum-batch-size recommendation.
- Financial module: invoicing, settlement statements, input financing.
- Driver/vehicle traceability & biosecurity logs; marketplace; disease surveillance; weather/heat-stress; vaccine compliance; peer benchmarking; PDF reports; multi-language (Shona/Ndebele).

---

## 14. Considerations & decision log

| Topic | Decision | Implication |
|---|---|---|
| Offline | Scoped to capture write-path (PWA local save + sync), mirroring WhatsApp's send-when-online. | Channel-agnostic payload; reads assume connectivity. |
| Maker-checker | Supervisor=maker, owner=checker, toggleable, **default off**. | Approval + audit behind a per-grower flag. |
| Multi-contractor | Contractors see only their own batch data on a shared grower. | One grower record; strict isolation. |
| Economics | Per-batch contract; **add FOC %** (≈1% free birds). | Margin accounts for FOC. |
| Benchmarks | Per-contractor CSV import. | Scoped to contractor+breed. *Need sample CSV.* |
| Granularity | Per house, per day; staggered per-house day-counts. | Placement holds per-house count + placing date. |
| Shifts | Daily-per-house canonical; AM/PM optional. | Shorter daily form. |
| Cycle length | **Contractor-set per cycle** (cycle 85 ≈ 31 days), via the planning message — not a fixed 35–42. | **Kill date is a stored target**, not computed. |
| Identifier | `farm code / cycle no.` (ZBNH/085 = Nhunge, cycle 85). | Cycle is the organizing unit; resolved. |
| Temperature | Optional per-house; diagnostic-only (mortality cause). | Capture field + cause rule, not a benchmark. |
| Collection | Phased night-catching with per-night counts; manifest of authorised trucks. | Feature J (catching) + K (manifest); progressive close. |
| Workflow fit | Mirror the messages; auto-do maths; share back to WhatsApp; WhatsApp integration top of roadmap. | Feature M in MVP. |
| Analytics | Rule-based + formula projections v1; ML later. | Transparent engine; data shaped for ML. |

**Open items:**
1. Shared-house occupancy across contractors — show "occupied" only (no detail)? *Recommend yes.*
2. Benchmark CSV — obtain the real Irvine's file (soft blocker for D).
3. Growth-ratio definition — confirm with the grower.
4. FOC mechanics — is the quoted count inclusive or exclusive of the free 1%, and how is it settled?
5. Catching — always at night/multi-night? Is a manifest always issued, and does the held count cover the whole flock or one round?
6. Branding scope — white-label per contractor or also per grower?
7. Weigh-day cadence — frequency and whether all houses are weighed each time.

---

## 15. Out of scope for MVP

WhatsApp two-way integration, native mobile app, broad offline-first beyond capture, IoT sensors, ML predictions, financial/payments module, marketplace, multi-language. (All in §13.)

---

## 16. Technical note (non-binding)

Next.js + Convex + Vercel fits well: reactive queries drive live status, maker-checker, and portfolio dashboards; the document model handles `contractor → grower/site → house → batch(cycle) → placement → daily/weight/delivery/catching entries` cleanly.

**Offline:** capture forms are PWA writers that save locally (IndexedDB) with a client-generated entry ID, queue, and replay to Convex on reconnect (idempotent), with a "pending/synced" badge — mirroring the WhatsApp send-queue the supervisor already trusts.

**Indicative data model:**
`Contractor → Grower/Site (farm code) → House`; `Batch/Cycle (one Contractor: cycle no., kill date, FOC%) → Placement (Batch×House: placed count, placing date, day count) → DailyEntry (mortality, culls, feed kg, optional temp/AM-PM) | WeightEntry (g, ADG, growth ratio, uniformity) | FeedDelivery (type, bags, bag size, net kg) | CatchingEvent (night, count, collection weight)`; `Manifest (Batch: vehicles[], drivers[], held count)`; `BenchmarkSet (Contractor×Breed)`; `Contract (per Batch, incl. FOC%)`. Cumulatives & rollups derived, not stored raw. Tenant isolation at the query layer.

**WhatsApp bridge:** keep capture payloads channel-agnostic so a future parser/bot can write the same records, and so the app can render data back out as a postable summary (feature M).
