/**
 * Central icon module. Every screen imports icons from HERE, never from
 * `@untitledui/icons` directly — so the whole set is swappable in one file.
 *
 * Untitled UI line icons already default to `stroke="currentColor"`,
 * `strokeWidth="2"` and `aria-hidden="true"`, so colour comes from our semantic
 * text tokens via `className` (e.g. `text-brand-600`) and theming keeps working.
 * Size with a `size-*` utility (24px in nav, smaller inline).
 */
export {
  // Grower nav
  Home01 as IconDashboard,
  ClipboardCheck as IconDailyUpdate,
  PackageCheck as IconFeed,
  Scales01 as IconWeights,
  ClockRewind as IconHistory,
  Columns03 as IconCompare,
  Building07 as IconHouses,
  Dataflow03 as IconAllocate,
  Bell01 as IconAlerts,
  Archive as IconArchive,
  // Contractor nav
  Users01 as IconGrowers,
  Truck01 as IconCollection,
  Target04 as IconBenchmark,
  // Status — tick / triangle / alert-circle (colour + icon + word + shape)
  CheckCircle as IconStatusGood,
  AlertTriangle as IconStatusWarn,
  AlertCircle as IconStatusBad,
  InfoCircle as IconInfo,
  // Vaccination day — shield + tick reads as "protected / immunised"
  ShieldTick as IconVaccine,
  // UI affordances
  Menu02 as IconMenu,
  XClose as IconClose,
  ChevronDown as IconChevronDown,
  ChevronLeftDouble as IconCollapse,
  ChevronRightDouble as IconExpand,
  Minus as IconMinus,
  Plus as IconPlus,
  Trash01 as IconTrash,
  Check as IconCheck,
  ArrowRight as IconArrowRight,
  // Button affordances — the dot expands into the glyph that fits the action
  ArrowLeft as IconArrowLeft,
  RefreshCcw01 as IconRefresh,
  Send01 as IconSend,
  LogIn01 as IconLogin,
  LogOut01 as IconLogout,
  Inbox01 as IconEmpty,
  Eye as IconView,
  SwitchHorizontal01 as IconSwitch,
  // Manager corrections (maker-checker) — pencil edits, person attribution
  Edit05 as IconEdit,
  User01 as IconUser,
  // Data-grid affordances — filter, column reorder, sort direction
  FilterLines as IconFilter,
  DotsGrid as IconDrag,
  ChevronSelectorVertical as IconSortNone,
  ArrowNarrowUp as IconSortAsc,
  ArrowNarrowDown as IconSortDesc,
} from "@untitledui/icons";

import type { FC, SVGProps } from "react";

/** Props shape shared by every icon (Untitled UI extends SVGProps + size/color). */
export type IconProps = SVGProps<SVGSVGElement> & { size?: number };
export type IconComponent = FC<IconProps>;
