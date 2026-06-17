"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads/writes a small piece of UI state to localStorage. Uses
 * useSyncExternalStore so SSR returns the default (no hydration mismatch) and
 * the client reads the stored value — no setState-in-effect. A manual "storage"
 * event keeps it in sync within the same tab after a write.
 */
export function usePersisted<T>(key: string, initial: T): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw == null ? initial : (JSON.parse(raw) as T);
      } catch {
        return initial;
      }
    },
    () => initial,
  );

  const set = (next: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore quota/private-mode errors */
    }
    window.dispatchEvent(new Event("storage"));
  };

  return [value, set];
}
