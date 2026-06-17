import type { Role } from "@/lib/types";

/* Minimal 24px line icons (2px stroke, round caps) per the brand icon system. */
type IconProps = { className?: string };
const I = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d.split("|").map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

const icons = {
  dashboard: (p: IconProps) => <I {...p} d="M3 12 12 4l9 8|5 10v9h14v-9" />,
  daily: (p: IconProps) => <I {...p} d="M5 4h11l3 3v13H5z|9 4v4h6|8 13h7|8 17h5" />,
  feed: (p: IconProps) => <I {...p} d="M6 8h12l-1 12H7z|9 8a3 3 0 0 1 6 0" />,
  weights: (p: IconProps) => <I {...p} d="M12 4v3|6 7h12|6 7 3 17h6zM18 7l3 10h-6z|9 20h6" />,
  history: (p: IconProps) => <I {...p} d="M4 12a8 8 0 1 0 3-6.2M4 5v4h4|12 8v4l3 2" />,
  compare: (p: IconProps) => <I {...p} d="M6 4v16|18 4v16|6 8h8m0 0-3-3m3 3-3 3|18 16H10m0 0 3 3m-3-3 3-3" />,
  houses: (p: IconProps) => <I {...p} d="M4 11 12 5l8 6|6 10v9h12v-9|10 19v-5h4v5" />,
  allocate: (p: IconProps) => <I {...p} d="M12 4v16|4 8h16|4 8l3 4-3 4|20 8l-3 4 3 4" />,
  alerts: (p: IconProps) => <I {...p} d="M6 9a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7|10 21h4" />,
  growers: (p: IconProps) => <I {...p} d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6|3 20a6 6 0 0 1 12 0|17 11a3 3 0 1 0-1-5.8|21 20a6 6 0 0 0-5-5.9" />,
  schedule: (p: IconProps) => <I {...p} d="M3 11h13l-1.5 6H4.5z|16 12h3l2 5h-5|6 17a2 2 0 1 0 4 0|15 17a2 2 0 1 0 4 0" />,
  benchmark: (p: IconProps) => <I {...p} d="M4 19V5|4 19h16|7 16l4-5 3 3 5-7" />,
} as const;

export type NavIcon = keyof typeof icons;
export const NavGlyph = ({ icon, className }: { icon: NavIcon; className?: string }) => icons[icon]({ className });

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
