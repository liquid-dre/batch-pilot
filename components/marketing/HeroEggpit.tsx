"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

/* three (~150KB) is code-split behind ssr:false and only imported once the gate
   below passes — so phones/low-power devices never download it. Next 16 requires
   ssr:false to live inside a Client Component (this file). */
const EggpitCanvas = dynamic(() => import("./EggpitCanvas"), { ssr: false });

/**
 * Only run the WebGL eggs when the device can clearly afford it: not
 * reduced-motion, desktop-class (width + a fine hover pointer), enough cores,
 * and WebGL present. Anything else falls back to the hero's static motif.
 */
function detectCapable(): boolean {
  try {
    const mm = (q: string) => window.matchMedia(q).matches;
    if (mm("(prefers-reduced-motion: reduce)")) return false;
    if (!mm("(min-width: 768px)")) return false;
    if (!mm("(hover: hover) and (pointer: fine)")) return false;
    if ((navigator.hardwareConcurrency ?? 8) < 4) return false;
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Computed once on the client, cached — read via useSyncExternalStore so the
// server snapshot is `false` (no canvas on SSR, no hydration mismatch, no
// setState-in-effect).
let cached: boolean | null = null;
function capableSnapshot(): boolean {
  if (cached === null) cached = detectCapable();
  return cached;
}
const subscribe = () => () => {};

export function HeroEggpit() {
  const capable = useSyncExternalStore(subscribe, capableSnapshot, () => false);
  return capable ? <EggpitCanvas /> : null;
}
