import type { Role } from "@/lib/types";
import {
  IconDashboard,
  IconDailyUpdate,
  IconFeed,
  IconWeights,
  IconHistory,
  IconCompare,
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

export const NAV: Record<Role, NavSection[]> = {
  grower: [
    { items: [{ key: "dashboard", label: "Dashboard", href: "/app", icon: "dashboard" }] },
    {
      label: "Records",
      items: [
        { key: "daily", label: "Daily update", href: "/app/daily", icon: "daily" },
        { key: "feed", label: "Feed deliveries", href: "/app/feed", icon: "feed" },
        { key: "weights", label: "Weights", href: "/app/weights", icon: "weights" },
      ],
    },
    {
      label: "Analytics",
      items: [
        { key: "history", label: "History & charts", href: "/app/history", icon: "history" },
        { key: "compare", label: "Batch comparison", href: "/app/compare", icon: "compare" },
      ],
    },
    {
      label: "Setup",
      items: [
        { key: "houses", label: "Houses", href: "/app/houses", icon: "houses" },
        { key: "allocate", label: "Allocate a cycle", href: "/app/houses/allocate", icon: "allocate" },
      ],
    },
    { items: [{ key: "alerts", label: "Alerts", href: "/app/alerts", icon: "alerts" }] },
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
