import Link from "next/link";
import { CardEyebrow } from "@/components/ui/Card";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: React.ReactNode;
  /** Optional breadcrumb back-link for nested screens (e.g. Setup / Allocate). */
  back?: { href: string; label: string };
}

/** Consistent screen header for the spacious grower register. */
export function PageHeader({ eyebrow, title, intro, action, back }: PageHeaderProps) {
  return (
    <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-1.5 inline-flex items-center gap-1 text-label font-medium text-muted underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
          >
            <span aria-hidden>←</span> {back.label}
          </Link>
        ) : null}
        {eyebrow ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
        <h1 className="mt-2 text-h1">{title}</h1>
        {intro ? <p className="mt-2 max-w-prose text-body-l text-slate">{intro}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
