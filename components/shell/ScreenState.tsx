import { PageHeader } from "./PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Shared loading / empty states for the Convex screen wrappers, so every
 * migrated screen shows a consistent "loading" and "no cycle yet" surface.
 */
export function ScreenLoading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader eyebrow={eyebrow} title={title} />
      <Card>
        <CardBody className="py-16 text-center text-body text-muted" aria-busy="true">
          Loading…
        </CardBody>
      </Card>
    </div>
  );
}

export function ScreenEmpty({
  eyebrow,
  title,
  heading,
  body,
}: {
  eyebrow: string;
  title: string;
  heading: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader eyebrow={eyebrow} title={title} />
      <Card>
        <CardBody className="space-y-2 py-12 text-center">
          <p className="text-h3 text-ink">{heading}</p>
          <p className="mx-auto max-w-md text-body text-slate">{body}</p>
        </CardBody>
      </Card>
    </div>
  );
}
