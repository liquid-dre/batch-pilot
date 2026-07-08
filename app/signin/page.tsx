"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import type { Role } from "@/lib/types";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

/**
 * Sign in / create account (ROADMAP §9 — Convex Auth, email + password).
 *
 * Account creation picks the account kind (grower Supervisor/Manager or
 * Contractor); the chosen role + name ride along to the Convex `Password`
 * provider's `profile` callback, which stores them and scopes the account to the
 * demo tenant. On success we land in `/app`, where the shell reads the identity
 * through the unchanged `useCurrentUser()` seam.
 */

type Mode = "signIn" | "signUp";

const ROLE_OPTIONS: { role: Role; label: string; hint: string }[] = [
  { role: "supervisor", label: "Supervisor / Foreman", hint: "Capture the daily numbers" },
  { role: "manager", label: "Manager", hint: "Oversee performance" },
  { role: "contractor", label: "Contractor / Supplier", hint: "Portfolio across growers" },
];

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuthActions();

  const intent = params.get("intent") as Role | null;
  const [mode, setMode] = useState<Mode>(intent ? "signUp" : "signIn");
  const [role, setRole] = useState<Role>(intent ?? "supervisor");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      flow: mode,
    };
    if (mode === "signUp") {
      payload.name = String(form.get("name") ?? "");
      payload.role = role;
    }
    try {
      await signIn("password", payload);
      router.push("/app");
    } catch {
      setError(
        mode === "signUp"
          ? "Could not create the account. That email may already be registered."
          : "Wrong email or password.",
      );
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-brand-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <LogoMark className="h-6 w-7" />
          <span className="font-display text-[1.25rem] font-extrabold tracking-[-0.02em]">BatchPilot</span>
        </div>

        <div className="rounded-[var(--radius-card)] bg-surface p-6 shadow-card sm:p-8">
          {/* Mode toggle */}
          <div role="tablist" aria-label="Sign in or create account" className="mb-6 flex gap-1 rounded-[var(--radius-control)] bg-brand-50 p-1">
            {(["signIn", "signUp"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-[calc(var(--radius-control)-3px)] px-3 py-2 text-label font-semibold transition-colors duration-[var(--dur)] ease-[var(--ease-out)]",
                  mode === m ? "bg-brand-700 text-white shadow-[0_1px_2px_rgba(11,42,74,0.2)]" : "text-brand-700 hover:bg-brand-100",
                )}
              >
                {m === "signIn" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>

          <h1 className="text-h2">{mode === "signIn" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-body text-muted">
            {mode === "signIn" ? "Sign in to your BatchPilot account." : "One account per person — pick what you do below."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            {mode === "signUp" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-label font-medium text-slate">Your name</span>
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="h-[52px] rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-slate">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-[52px] rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-slate">Password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                className="h-[52px] rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-body text-ink outline-none focus-visible:border-brand-500"
              />
            </label>

            {mode === "signUp" && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-label font-medium text-slate">I am a…</legend>
                {ROLE_OPTIONS.map((o) => (
                  <label
                    key={o.role}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border p-3 transition-colors",
                      role === o.role ? "border-brand-500 bg-brand-50" : "border-border hover:bg-paper",
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={o.role}
                      checked={role === o.role}
                      onChange={() => setRole(o.role)}
                      className="size-4 accent-brand-700"
                    />
                    <span className="flex flex-col">
                      <span className="text-label font-semibold text-ink">{o.label}</span>
                      <span className="text-[0.8125rem] text-muted">{o.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {error && (
              <p role="alert" className="rounded-[var(--radius-control)] bg-status-bad-tint px-3 py-2 text-label text-status-bad">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-[52px] items-center justify-center rounded-[var(--radius-control)] bg-brand-700 px-6 text-[1.0625rem] font-semibold text-white transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Please wait…" : mode === "signIn" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-label text-brand-100/80">
          {mode === "signIn" ? "New to BatchPilot? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            {mode === "signIn" ? "Create one" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
