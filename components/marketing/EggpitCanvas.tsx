"use client";

import { useEffect, useRef } from "react";
import { createEggpit, type EggpitHandle } from "./eggpit/engine";

/* Egg-shell colours live in globals.css (:root). Read them at runtime so the
   WebGL layer carries no raw hex and re-themes from the one token file. */
const EGG_VARS = ["--egg-white", "--egg-cream", "--egg-tan", "--egg-brown", "--egg-brown-deep"];

function readEggColors(): number[] {
  const s = getComputedStyle(document.documentElement);
  return EGG_VARS.map((v) => s.getPropertyValue(v).trim().replace(/^#/, ""))
    .filter((h) => /^[0-9a-f]{6}$/i.test(h))
    .map((h) => parseInt(h, 16));
}

/**
 * The client-only egg canvas. Rendered only when `HeroEggpit` has decided the
 * device is capable, and code-split behind `dynamic(ssr:false)` so it (and the
 * `three` bundle) never load on phones/low-power. Decorative + inert: the whole
 * layer is `aria-hidden` and `pointer-events-none`, so it never blocks the CTAs.
 */
export default function EggpitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: EggpitHandle | undefined;
    try {
      handle = createEggpit(canvas, {
        count: 50,
        gravity: 1,
        friction: 0.928,
        wallBounce: 0.85,
        followCursor: true,
        colors: readEggColors(),
      });
    } catch {
      return; // any WebGL init failure → leave the static hero motif in place
    }

    // Pause the RAF loop while the hero is scrolled out of view.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? handle?.resume() : handle?.pause()),
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      handle?.dispose();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
