"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Light/dark theme. Class-based (`.dark` on <html>), persisted to localStorage
 * (`bp.theme`), default light. The no-flash class is set pre-hydration by the
 * inline script in `app/layout.tsx`; this hook reads the live DOM class via
 * useSyncExternalStore (SSR snapshot = light → no hydration mismatch, no
 * setState-in-effect) and flips it.
 */
export type Theme = "light" | "dark";
const KEY = "bp.theme";
const EVENT = "bp:theme";

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
function getServerSnapshot(): Theme {
  return "light";
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore private-mode/quota */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [theme, setTheme];
}
