"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Reads/writes a small piece of UI state to localStorage. Uses
 * useSyncExternalStore so SSR returns the default (no hydration mismatch) and
 * the client reads the stored value — no setState-in-effect. A manual "storage"
 * event keeps it in sync within the same tab after a write.
 *
 * The snapshot is memoised by the raw string: `getSnapshot` must return a stable
 * reference when nothing changed, or React re-renders forever. Parsing every
 * call returns a fresh object/array for non-primitive values and would loop.
 */
export function usePersisted<T>(key: string, initial: T): [T, (next: T) => void] {
  const cache = useRef<{ raw: string | null; value: T }>({ raw: null, value: initial });

  const getSnapshot = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initial;
      if (raw !== cache.current.raw) cache.current = { raw, value: JSON.parse(raw) as T };
      return cache.current.value;
    } catch {
      return initial;
    }
  }, [key, initial]);

  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    getSnapshot,
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
