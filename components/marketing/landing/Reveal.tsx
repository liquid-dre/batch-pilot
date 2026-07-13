"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Tasteful scroll-reveal. Content is visible by default (progressive
 * enhancement — never gated on JS); when it first scrolls into view we play a
 * short opacity+translate entrance via the Web Animations API. The element's
 * resting state stays visible, so no-JS/headless renders and crawlers see the
 * content, and `prefers-reduced-motion` skips the motion entirely. No
 * setState-in-effect (the repo's lint forbids it).
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window) || typeof el.animate !== "function") return;

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          el.animate(
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)", delay, fill: "both" },
          );
          obs.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
