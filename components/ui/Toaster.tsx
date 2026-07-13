"use client";

import { Toaster } from "sonner";
import { IconStatusGood, IconStatusWarn, IconStatusBad, IconInfo } from "@/components/icons";

/**
 * The single toast surface, mounted once in the root layout. Positioned
 * top-right (Sonner defaults to bottom-right, so this is explicit). Our status
 * glyphs give success/warning/error/info parity with StatusPill; colour, radius
 * and shadow are themed from our tokens on `[data-sonner-toast]` in globals.css
 * (not richColors, which would impose Sonner's own palette). Motion degrades via
 * the global prefers-reduced-motion reset.
 *
 * - duration 4000ms: matches the old toast; long enough to read a save line.
 * - visibleToasts 3: a calm stack — a fast capture round never buries the screen.
 * - closeButton: dismissable by choice, and a clear affordance for a11y.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      duration={4000}
      visibleToasts={3}
      closeButton
      gap={10}
      toastOptions={{ className: "bp-toast" }}
      icons={{
        success: <IconStatusGood className="size-[1.125rem]" />,
        warning: <IconStatusWarn className="size-[1.125rem]" />,
        error: <IconStatusBad className="size-[1.125rem]" />,
        info: <IconInfo className="size-[1.125rem]" />,
      }}
    />
  );
}
