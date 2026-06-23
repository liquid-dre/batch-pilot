import type { Role } from "@/lib/types";
import {
  IconDashboard,
  IconDailyUpdate,
  IconFeed,
  IconWeights,
  IconHistory,
  IconCompare,
  IconArchive,
  IconHouses,
  IconAllocate,
  IconAlerts,
  IconGrowers,
  IconCollection,
  IconBenchmark,
  type IconComponent,
} from "@/components/icons";

/* Nav glyphs map to Untitled UI icons via the central module (one swap point). */
const icons: Record<string, IconComponent> = {
  dashboard: IconDashboard,
  daily: IconDailyUpdate,
  feed: IconFeed,
  weights: IconWeights,
  history: IconHistory,
  compare: IconCompare,
  batches: IconArchive,
  houses: IconHouses,
  allocate: IconAllocate,
  alerts: IconAlerts,
  growers: IconGrowers,
  schedule: IconCollection,
  benchmark: IconBenchmark,
};

export type NavIcon = keyof typeof icons;
export const NavGlyph = ({ icon, className }: { icon: NavIcon; className?: string }) => {
  const Glyph = icons[icon];
  return <Glyph className={className} />;
};

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: NavIcon;
}

export interface NavSection {
  /** Group heading; omitted for top-level standalone items. */
  label?: string;
  items: NavItem[];
}

// Setup is shared by both grower profiles.
const GROWER_SETUP: NavSection = {
  label: "Setup",
  items: [
    { key: "houses", label: "Houses", href: "/app/houses", icon: "houses" },
    { key: "allocate", label: "Allocate a cycle", href: "/app/houses/allocate", icon: "allocate" },
  ],
};
const GROWER_ALERTS: NavSection = { items: [{ key: "alerts", label: "Alerts", href: "/app/alerts", icon: "alerts" }] };

export const NAV: Record<Role, NavSection[]> = {
  // Supervisor / foreman — the data capturer. The home is one calm capture
  // screen (the daily round) and the nav stays deliberately tiny so the
  // supervisor never feels overwhelmed: just the daily capture plus logging a
  // feed delivery. Oversight (analytics, setup, alerts) lives with the Manager.
  supervisor: [
    { items: [{ key: "home", label: "Today's capture", href: "/app", icon: "daily" }] },
    { items: [{ key: "feed", label: "Feed deliveries", href: "/app/feed", icon: "feed" }] },
  ],
  // Manager — oversight. Home is the consolidated dashboard; the nav is
  // analytics-first, with setup + alerts. Capture is the supervisor's job.
  manager: [
    { items: [{ key: "dashboard", label: "Dashboard", href: "/app", icon: "dashboard" }] },
    {
      label: "Analytics",
      items: [
        { key: "history", label: "History & charts", href: "/app/history", icon: "history" },
        { key: "batches", label: "Previous batches", href: "/app/batches", icon: "batches" },
        { key: "compare", label: "Batch comparison", href: "/app/compare", icon: "compare" },
      ],
    },
    GROWER_SETUP,
    GROWER_ALERTS,
  ],
  contractor: [
    { items: [{ key: "overview", label: "Overview", href: "/app", icon: "dashboard" }] },
    { items: [{ key: "growers", label: "Growers", href: "/app/growers", icon: "growers" }] },
    { items: [{ key: "schedule", label: "Collection schedule", href: "/app/schedule", icon: "schedule" }] },
    { items: [{ key: "benchmark", label: "Benchmarks", href: "/app/benchmark", icon: "benchmark" }] },
  ],
};

/** Is `href` the active route for `pathname`? (`/app` is exact; others prefix-match.) */
export function isActive(href: string, pathname: string): boolean {
  if (href === "/app") return pathname === "/app";
  // Allocate is a child of Houses; only light it (not Houses) on the allocate route.
  if (href === "/app/houses") return pathname === "/app/houses";
  return pathname === href || pathname.startsWith(href + "/");
}
