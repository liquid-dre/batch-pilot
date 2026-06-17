import { cn } from "@/lib/cn";

/** A shimmering placeholder block for loading states (reduced-motion safe). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} aria-hidden />;
}
