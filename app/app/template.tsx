/**
 * Route-transition wrapper. A `template` re-mounts on every navigation, so the
 * page content gets a subtle rise-in as you move between screens (the TopBar in
 * the layout stays put). Pure CSS, so `prefers-reduced-motion` disables it.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
