# BatchPilot — Brand & Product Design Guidelines (agent reference)

Agent-readable version of the brand guideline. The visual system carries over from the original
"Coopilot" guideline; the product name is now **BatchPilot**. Build tokens live authoritatively in
`globals.css` (seeded from `ROADMAP.md §6`); this file is the rationale + the rules + the voice.

---

## 1. Foundation

**Positioning.** BatchPilot turns the daily work of rearing chickens into clear, confident decisions —
telling every grower how their flock is doing and what to do next, while giving contractors a live,
trustworthy picture of their whole network.

**Personality.** Trustworthy (calm, accurate, never alarmist) · Practical (built for one hand, bright
sun, a thumb — answers "what now?" before it shows a chart) · Approachable (warm, plain language, big
friendly controls) · Locally rooted (designed around Zimbabwean farms, without tractor/leaf/"Africa"
clichés).

**Tone, one line:** "A knowledgeable colleague standing next to you in the chicken house — clear, calm,
and on your side."

---

## 2. Logo

Two ascending chevrons — a rising trajectory and a roofline at once. Purely geometric (no bird, leaf or
tractor), so it's credible to contractors, sharp at 16px, and reproducible as one flat colour for
theming. Lockups: horizontal (mark + "BatchPilot"), stacked, app icon, round avatar, reversed (on dark),
mono. Clear space ≥ half the mark height. Min size 24px icon / 100px lockup; below that use the icon
alone. Never: stretch/distort, recolour to status colours, rotate, or add shadows/busy backgrounds.

---

## 3. Colour

The system is **monochrome (black-and-white) + ONE vibrant azure accent**, shipped in **two modes** —
**light (default)** and **dark (near-black greyscale, X-dark-mode inspired)** — with a persisted toggle.
The base is deliberately greyscale so the product reads clean and calm; **azure is reserved for the few
things that matter: major CTAs, links, the focus ring, and active/selected states** (≈5–10% of the
surface). Everything else — surfaces, borders, secondary/ghost buttons, body text, non-active tints — is
neutral grey. Because components read semantic tokens, flipping the token values under `.dark` cascades
the whole app. *(Crimson and Horizon blue are both retired — crimson read as alarmist; the one accent is
now azure.)*

**Brand — azure accent (themeable).** LIGHT: `brand900 #0B0B0C` (constant near-black, explicit
dark-chrome value only) · `brand800 #0A4F8F` (primary-button hover) · `brand700 #0C62B0` (the CTA / active
**fill** — white text 6.2:1, kept constant across modes) · `brand600 #0E6FC4` (link / active **text** —
flips brighter on dark) · `brand500 #0EA5E9` (bright accent / marks) · `brand100 #DBEAFE` /
`brand50 #EFF6FF` (tints, active-nav). DARK overrides: `brand600 → #38BDF8`, `brand500 → #38BDF8`,
`brand100 → #14324C`, `brand50 → #0E2233`. **Rule: fills use `brand700` (deep, stays constant so
white-on-fill holds AA); accent *text* uses `brand600` (brightens on dark).** The old cyan `accent-*` ramp
is folded onto the same azure (focus ring + info callouts).

**Inverse / dark-chrome tokens.** For chrome that is intentionally dark in *both* modes (marketing hero,
FinalCta band, dense table headers, tooltips, the drawer scrim): `canvas-invert` (`#0B0B0C` light /
`#17171A` dark) · `surface-invert` (elevated dark) · `on-invert #E7E9EA` + `on-invert-dim #A1A1AA` (light
text, constant). Never dress a dark island with `brand-900`/`brand-100` — those don't read after the flip.

**Neutrals — true greyscale (flips per mode).** LIGHT: Ink `#0A0A0A` · Slate `#3F3F46` · Muted `#52525B`
· Hint `#71717A` · Border `#E4E4E7` · Divider `#EFEFF1` · Paper `#F7F7F8` · Surface `#FFFFFF`. DARK: Ink
`#FAFAFA` · Slate `#D4D4D8` · Muted `#A1A1AA` · Hint `#8B8B93` · Border `#26262A` · Divider `#1E1E21` ·
Paper `#0B0B0C` · Surface `#161618`. Body text is Ink on Paper (~19:1 light, ~18:1 dark) — AA-verified,
muted ≥ 4.5:1 in both.

**Status — fixed & reserved (never used for branding):** Green `#1F7A3D` (on track) · Amber `#C77800`
(at risk) · Red `#C62828` (needs attention), each with an AA-safe tint per mode (dark tints are faint,
hued near-blacks so they don't glow on the dark surface). **Status is never communicated by colour alone**
— always colour + icon (`✓`/`△`/`!`) + word + shape (`●`/`▲`/`■`). Danger/error UI stays on the reserved
status-red; the azure accent never signals status.

**Chart series (vibrant, validated).** All charts use the shadcn chart primitive (`components/ui/chart.tsx`
— `ChartContainer` injects each config colour as `--color-<key>`) and keep a vibrant categorical set —
teal · crimson · violet · ochre/gold · indigo · coral — tuned **per mode** (LIGHT `#0D8BA3 #E01A4F #7A5CC0
#B8790F #4B5BD0 #F15946`; DARK `#17A2BA #EF3B63 #9575E6 #BD8514 #6472E0 #F05E3A`). Ordered to be
colour-blind-separable and to lead with band-safe hues so a single line stays legible over the status
bands. **Chart crimson/coral/gold live in charts ONLY** — never as UI/brand/status, so they can't be
mistaken for the reserved amber/red. (Data lines for the primary "actual/projected" metric use the azure
`brand-600`/`brand-500` accent.)

**Themeable:** azure brand + accent scale, inverse-chrome tokens, logo/name, chart series. **Fixed:**
status colours, the greyscale neutrals structure, type, spacing, radius, icon style.

---

## 4. Typography

- **Plus Jakarta Sans** — display, headings, logo. Weights 600–800.
- **IBM Plex Sans** — body, UI, labels. Weights 400–600. Tall x-height, legible in glare.
- **IBM Plex Mono** — data, metrics, codes. Tabular figures so numbers align and 0/O never blur.

Scale (mobile-first): Display 32/700 · H1 26/700 · H2 21/600 · H3 18/600 · Body-L 17/400 · Body 15/400 ·
Label 14/500 · Data 15/500 (mono). Body never < 15px; tappable text ≥ 16px.

---

## 5. Iconography & imagery

Icons: 24px grid, 2px stroke, round caps/joins, no fills; geometric, minimal interior detail (sharp at
20px in glare). Two-tone reserved for status icons only. Many supervisors read little English — a clear
glyph is often the primary label, so pair messages with icons. Imagery: prefer icons/flat illustration;
any photos are real, documentary, working farms — never staged stock, no gradients, no "Africa" clichés,
no tractors. Always ship a solid-colour offline fallback.

---

## 6. Components

- **Buttons:** Large 52px / Default 44px / Small 36px, all pill-shaped, with the dot-that-expands-into-its-
  glyph affordance. Grower screens use Large only (clears the 44px tap minimum with room for gloves).
  Primary = azure `brand700` fill on white (the one CTA colour); secondary + ghost = **monochrome**
  (neutral border/text/hover, no accent); danger = status-red tint; disabled = divider/hint. The `inverse`
  variant sits on dark chrome (`canvas-invert`) and keeps the azure primary + on-invert monochrome rest.
- **Inputs:** 52–64px tall. Numeric entry on grower screens uses a **big +/− stepper**, not a keyboard
  (low-literacy, gloved, in-sun). Focused state = azure accent ring.
- **Status indicator (signature component):** card with `FLOCK · DAY` header, a pill (tint bg + status
  colour + icon + word + shape), and a plain-language line ("Feed is below target. Check the feeders.").
- **Alerts:** info (azure accent tint), success (green tint), warning (amber tint), error (red tint); icon +
  bold title + plain line.
- **Data table (contractor):** near-black header row, mono tabular numbers, status pills, dense rows.

---

## 7. Voice & tone

One brand, two registers; always calm, honest, on-your-side.

- **To growers:** short sentences, everyday words, lead with the action ("Add feed."), warm and never
  blaming, pair with an icon, localise to Shona/Ndebele where possible.
- **To contractors:** precise and data-forward (give the figure), neutral and professional, name the
  house/metric/timeframe, recommend the action then the reason; industry terms fine (FCR, curve, intake).

**Microcopy examples**
- Feed-low — grower: "Feed is a bit low today. Check the feeders and top them up if you can." ·
  contractor: "House 1 feed intake is 12% below curve at day 18. Review feeder calibration."
- Empty state — grower: "No record for today yet. Tap the big blue button to add today's numbers." ·
  contractor: "No data for this flock yet. Records appear once the supervisor submits day 1."
- Save failed — grower: "That didn't save. Your numbers are safe — tap Save to try again." ·
  contractor: "Submission failed — no connection. Entry saved locally; it will retry to sync."

---

## 8. Accessibility (treated as survival, not compliance)

- WCAG 2.1 AA minimum: body ≥ 4.5:1, UI/large text ≥ 3:1 (most pairings exceed 7:1).
- Grower tap targets 52–64px with ≥ 8px spacing (gloves).
- Status = colour + icon + word + shape (works in greyscale and for colour-blind users).
- 15px body floor; 16px+ on anything tappable; respect OS text scaling and `prefers-reduced-motion`.

**Do:** keep brand blue clear of green/amber/red · show status with an icon + word always · use the big
stepper · write the action first, the reason second · define new colours as tokens.
**Don't:** theme in green/yellow/red · signal status by colour alone · use thin type or grey-on-grey for
key data · hide actions behind tiny unlabelled icons · lean on heavy gradients/shadows/photos.
