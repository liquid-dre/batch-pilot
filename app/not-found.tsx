import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/** Branded 404 — sits outside the app shell. */
export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-paper px-4 py-24 text-center">
      <Logo />
      <p className="font-mono text-label text-hint">404</p>
      <h1 className="text-h1">This page isn&apos;t here</h1>
      <p className="max-w-sm text-body-l text-slate">The link may be old or mistyped. Let&apos;s get you back on track.</p>
      <Link
        href="/app"
        className="inline-flex h-[52px] items-center rounded-[var(--radius-control)] bg-[var(--color-primary)] px-6 text-[1.0625rem] font-semibold text-white transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
      >
        Back to the app
      </Link>
    </div>
  );
}
