"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "error";

interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
  leaving?: boolean;
}

interface ToastOptions {
  tone?: Tone;
  description?: string;
  /** Auto-dismiss delay in ms (default 4000). */
  duration?: number;
}

interface ToastContextValue {
  toast: (title: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_FG: Record<Tone, string> = {
  info: "text-brand-700",
  success: "text-status-good",
  error: "text-status-bad",
};

const Dot = ({ tone }: { tone: Tone }) => {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M5 8.2 7 10.2 11 5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === "error") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="currentColor" />
        <path d="M8 4.4v4.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.2" r="1" fill="white" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 7.2v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.7" r="0.95" fill="white" />
    </svg>
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 200);
  }, []);

  const toast = useCallback(
    (title: string, options?: ToastOptions) => {
      const id = ++counter.current;
      const item: ToastItem = { id, tone: options?.tone ?? "info", title, description: options?.description };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => remove(id), options?.duration ?? 4000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[var(--z-toast)] flex flex-col items-center gap-2 px-4"
        role="region"
        aria-label="Notifications"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-control)] bg-surface p-3.5 shadow-raised",
              "transition-[opacity,transform] duration-[var(--dur)] ease-[var(--ease-out)]",
              t.leaving ? "translate-y-1 opacity-0" : "animate-rise",
            )}
          >
            <span className={cn("mt-0.5 shrink-0", TONE_FG[t.tone])}>
              <Dot tone={t.tone} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-label font-semibold text-ink">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-body text-muted">{t.description}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
