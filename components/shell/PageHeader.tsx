import { CardEyebrow } from "@/components/ui/Card";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: React.ReactNode;
}

/** Consistent screen header for the spacious grower register. */
export function PageHeader({ eyebrow, title, intro, action }: PageHeaderProps) {
  return (
    <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
        <h1 className="mt-2 text-h1">{title}</h1>
        {intro ? <p className="mt-2 max-w-prose text-body-l text-slate">{intro}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
