import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArchive } from "@/components/icons";

/**
 * House logbook — pick a house to see its day-by-day entries and cumulative
 * totals across the cycle (read-only). The screen isn't built yet; this is a
 * calm placeholder so the nav destination exists and explains itself rather
 * than 404-ing.
 */
export default function LogbookPage() {
  return (
    <GrowerOnly>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow="Records"
          title="House logbook"
          intro="Pick a house to see every day you recorded and its running totals for the cycle."
        />
        <div className="mt-6">
          <EmptyState
            icon={<IconArchive className="size-6" />}
            title="Coming soon"
            body="This is where each house's daily entries and cumulative totals will live, one cycle at a time. For now, the full day-by-day record is on Cycle history."
          />
        </div>
      </div>
    </GrowerOnly>
  );
}
