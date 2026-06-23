"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Reads/writes a small piece of UI state to web storage. Uses
 * useSyncExternalStore so SSR returns the default (no hydration mismatch) and
 * the client reads the stored value — no setState-in-effect. A manual "storage"
 * event keeps it in sync within the same tab after a write.
 *
 * The snapshot is memoised by the raw string: `getSnapshot` must return a stable
 * reference when nothing changed, or React re-renders forever. Parsing every
 * call returns a fresh object/array for non-primitive values and would loop.
 */
const SYNC_EVENT = "bp:storage";

function usePersistedIn<T>(getStorage: () => Storage, key: string, initial: T): [T, (next: T) => void] {
  const cache = useRef<{ raw: string | null; value: T }>({ raw: null, value: initial });

  const getSnapshot = useCallback((): T => {
    try {
      const raw = getStorage().getItem(key);
      if (raw == null) return initial;
      if (raw !== cache.current.raw) cache.current = { raw, value: JSON.parse(raw) as T };
      return cache.current.value;
    } catch {
      return initial;
    }
  }, [getStorage, key, initial]);

  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener(SYNC_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(SYNC_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    getSnapshot,
    () => initial,
  );

  const set = useCallback(
    (next: T) => {
      try {
        getStorage().setItem(key, JSON.stringify(next));
      } catch {
        /* ignore quota/private-mode errors */
      }
      window.dispatchEvent(new Event(SYNC_EVENT));
    },
    [getStorage, key],
  );

  return [value, set];
}

const localStore = () => window.localStorage;
const sessionStore = () => window.sessionStorage;

/** Persist across browser sessions (localStorage). */
export function usePersisted<T>(key: string, initial: T): [T, (next: T) => void] {
  return usePersistedIn(localStore, key, initial);
}

/** Persist for the current tab session only (sessionStorage) — clears on close. */
export function useSessionPersisted<T>(key: string, initial: T): [T, (next: T) => void] {
  return usePersistedIn(sessionStore, key, initial);
}
