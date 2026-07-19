/**
 * Marketing landing copy — THE ONE place this wording lives (mirrors the
 * `lib/copy.ts` pattern: plain, typed consts, no React). Tune the page by
 * editing here.
 *
 * Two voice registers (brand-guidelines §7):
 *  - grower  → plain, calm, on-your-side, lead with the action;
 *  - contractor → precise, data-forward, name the figure.
 *
 * Honesty guardrails (BRD §13/§15, §7): nothing here implies BatchPilot reads or
 * parses WhatsApp messages today (two-way capture is roadmap — only a one-tap
 * share-back ships); the ~13%-under weight story is a labelled *illustrative*
 * example, not measured field data; provenance is "grounded in real field data
 * from an active Irvine's grower (Nhunge, cycle 85)", never "built with".
 */
import type { Role } from "@/lib/types";

export const hero = {
  eyebrow: "WhatsApp-native ops for broiler farms",
  headline: "Know a flock's behind on day 18 — not at the collection date.",
  subhead:
    "Your team already texts the morning numbers. BatchPilot turns them into cumulative %, a clear per-house status, and a projection to the contractor's collection date — so you act while it still changes the outcome.",
  primaryCta: "Get started",
  secondaryCta: "Log in",
  trustLine: "Grounded in real field data from an active Irvine's grower.",
} as const;

export const problem = {
  eyebrow: "The morning grind",
  heading: "Right now, the whole flock is a wall of numbers in a group chat.",
  body:
    "One WhatsApp group holds the supervisor, the owner and the contractor. Before the day starts, the supervisor hand-tallies cumulative mortality, cull-and-mort, cum %, birds remaining and a site-average block — across six houses. It's slow, it's easy to mistype, and by tomorrow it has scrolled out of sight.",
  kicker:
    "No history. No trend. No track record. The first time anyone sees a real problem is at the collection date — when the margin is already gone.",
  stats: [
    { value: "6", label: "houses, tallied by hand" },
    { value: "~96,000", label: "birds on one site" },
    { value: "every", label: "morning, by hand" },
  ],
} as const;

/* The wedge — the real WhatsApp message (BRD §7.2, reproduced as-is) beside what
   BatchPilot computes from the same raw fields. */
export const wedge = {
  eyebrow: "Show, don't tell",
  heading: "The same message — with the maths already done, and kept.",
  body:
    "Your supervisor types the same raw numbers they type today. BatchPilot fills in every cumulative, percentage and rollup the moment they do.",
  whatsapp: {
    title: "Today, in the group",
    header: "GOOD MORNING · ZBNH/085 · 12/06/26 · Mortality Update",
    rows: [
      "Day 27  H1  Mort 17  Culls 0  C&M 17  CumMort 296  Cum% 1.83%  Feed 2350kg",
      "Day 27  H2  Mort 16  Culls 0  C&M 16  CumMort 298  Cum% 1.84%  Feed 2600kg",
      "Day 26  H3  Mort 18  Culls 0  C&M 18  CumMort 530  Cum% 3.28%  Feed 2350kg",
      "Day 26  H4  Mort 8   Culls 0  C&M 8   CumMort 273  Cum% 1.68   Feed 2350kg",
      "Day 26  H5  Mort 19  Culls 0  C&M 19  CumMort 355  Cum% 2.19   Feed 2450kg",
      "Day 26  H6  Mort 30  Culls 0  C&M 30  CumMort 368  Cum% 2.27   Feed 3000kg",
      "Site  Remaining 94783  CumMort 2120  Mort% 2.18  Chlorine 3ppm",
    ],
    caption: "Totted up by hand every day — then gone by tomorrow.",
  },
  batchpilot: {
    title: "In BatchPilot",
    typedLabel: "The supervisor types",
    typed: ["Day", "House", "Mortality", "Culls", "Feed (kg)", "Chlorine"],
    computedLabel: "BatchPilot computes",
    computed: ["Cull & mort", "Cum. mortality", "Cum. %", "Birds remaining", "Site average"],
    caption: "Type the raw numbers. We do the rest, keep the history, and flag what needs a look.",
  },
  whatsappNative: {
    heading: "You don't have to leave WhatsApp.",
    body:
      "BatchPilot mirrors the exact message your team already sends, does the maths, and hands back a formatted summary to post into the group in one tap. Automatic two-way capture — reading your messages for you — is on the roadmap.",
  },
} as const;

export interface RoleSection {
  key: string;
  role: Role;
  eyebrow: string;
  heading: string;
  bullets: string[];
  cta: string;
}

export const rolesIntro = {
  eyebrow: "Who it's for",
  heading: "One record, three jobs.",
  body: "The supervisor captures, the manager oversees, the contractor plans — each sees exactly what their job needs.",
} as const;

export const roles: RoleSection[] = [
  {
    key: "supervisor",
    role: "supervisor",
    eyebrow: "Supervisor / Foreman",
    heading: "Capture the whole morning in under a minute.",
    bullets: [
      "Type only what you counted — day and night mortality, culls, feed. No cumulative maths, no jargon.",
      "Big +/− steppers built for one thumb, gloves and bright sun — no fiddly keyboard.",
      "See today's read in plain words: “Feed is a bit low today. Check the feeders.”",
      "Runs on a cheap Android, and saves your entry even when the signal drops.",
    ],
    cta: "Capture a day",
  },
  {
    key: "manager",
    role: "manager",
    eyebrow: "Manager / Owner",
    heading: "See the whole site — and whether you'll hit the date.",
    bullets: [
      "Status per house and per site: green, amber or red, with the likely cause and the fix.",
      "A projection to the contractor's collection date, updated as the numbers come in.",
      "Fix a mis-typed entry — the correction is attributed, so the record stays honest.",
      "History, charts and batch-to-batch comparison, not a chat you have to scroll back through.",
    ],
    cta: "See the dashboard",
  },
  {
    key: "contractor",
    role: "contractor",
    eyebrow: "Contractor",
    heading: "Every grower you supply, ranked and forecast — live.",
    bullets: [
      "One portfolio across every flock: projected ready-date vs. collection date, house by house.",
      "Rank growers by EPEF; drill into any site's daily record and trend.",
      "Plan the catch and reconcile feed — spot a delivery short of the order before it costs you.",
      "Strict isolation: you see only your own batches, even on a grower you share.",
    ],
    cta: "Open the portfolio",
  },
];

export const catchItEarly = {
  eyebrow: "Catch it early",
  heading: "Under the curve at day 28 is a day-18 problem you couldn't see.",
  body:
    "BatchPilot plots every weigh-in against the Ross 308 objective, inside a green / amber / red band. When a house eats at or above the feed target but tracks below the weight curve, that's an efficiency problem — and it shows weeks before the collection truck arrives.",
  exampleLabel: "Illustrative example",
  exampleBody:
    "A flock running ~13% under the Ross 308 target at day 28 — flagged around day 18, while feed intake was on target.",
  statusLabel: "At risk",
  chartNote: "Actual weigh-ins vs the Ross 308 objective.  ≥97% on track · 90–97% at risk · <90% needs attention.",
} as const;

export const howItWorks = {
  eyebrow: "How it works",
  heading: "Four steps from group chat to a clear view.",
  steps: [
    { n: 1, title: "Add your houses", body: "Set up each house and its capacity once." },
    { n: 2, title: "Start a cycle", body: "Enter the placing counts and the contractor's collection date." },
    { n: 3, title: "Capture the day", body: "The supervisor types the raw numbers each morning." },
    { n: 4, title: "See status & projections", body: "Cumulatives, per-house status and a collection-date projection — automatically." },
  ],
} as const;

export const trust = {
  eyebrow: "Built on real numbers",
  heading: "Grounded in a real cycle, not a mock-up.",
  body:
    "BatchPilot's flows, figures and formats come from real WhatsApp messages and documents from an active Irvine's broiler grower — Nhunge, cycle 85, six houses. Performance is measured against the published Ross 308 objectives.",
  points: [
    "Real daily mortality, feed-delivery and weigh-in records — the app's capture maps to them one-to-one.",
    "Projections always read against the contractor's collection date, the way the contract is actually planned.",
    "Efficiency KPIs — FCR, EPEF, projected margin — computed, not eyeballed.",
  ],
  disclaimer: "Demo build. Figures shown are from the sample cycle and clearly-labelled illustrative scenarios.",
} as const;

export const faq = {
  eyebrow: "Questions",
  heading: "Straight answers.",
  items: [
    {
      q: "Do I have to stop using WhatsApp?",
      a: "No. Your team keeps working in the group. BatchPilot mirrors the same daily message in fast forms, does the maths, and gives you a summary to post back in one tap. Automatic two-way capture is on the roadmap.",
    },
    {
      q: "What does it cost to try?",
      a: "Nothing to look. The demo runs on a real sample cycle with no sign-up — jump straight in and click around.",
    },
    {
      q: "Will it work on a cheap phone with a weak signal?",
      a: "Yes. It's built for a low-end Android with big touch targets, and it saves your entry even when the connection drops.",
    },
    {
      q: "Who can see my data?",
      a: "Roles are separated: a supervisor captures, a manager oversees, and a contractor sees only their own batches — even on a grower they share.",
    },
    {
      q: "Where do the benchmarks come from?",
      a: "Weight, feed and mortality targets follow the published Ross 308 performance objectives; a contractor can load their own breed curve.",
    },
    {
      q: "Can a wrong entry be fixed?",
      a: "Yes — a manager can correct a mis-typed number, and the change is attributed so the record stays trustworthy.",
    },
  ],
} as const;

export const finalCta = {
  heading: "See it on a real cycle.",
  body: "No sign-up. The demo runs on Nhunge, cycle 85 — jump straight in.",
  cta: "Get started",
  secondaryCta: "Log in",
} as const;

export const footer = {
  tagline: "A clear, calm view of every flock. Demo build.",
} as const;
