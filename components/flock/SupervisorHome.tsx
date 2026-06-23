"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import type { GrowerDashboardData } from "./GrowerDashboard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/shell/PageHeader";
import { AlertsList } from "./AlertsList";
import { SiteRollupCard } from "./SiteRollupCard";
import {
  IconDailyUpdate,
  IconFeed,
  IconWeights,
  IconArrowRight,
  IconCheck,
  type IconComponent,
} from "@/components/icons";

function countdownLabel(days: number): string {
  if (days > 1) return `Collection in ${days} days`;
  if (days === 1) return "Collection tomorrow";
  if (days === 0) return "Collection target is today";
  return "Past collection target";
}

/**
 * The supervisor / foreman home: capture-first. The whole screen is built around
 * the one job — getting today's numbers in across every house — with the daily
 * round front and centre, quick paths to feed and weights, the watch-list so the
 * capturer knows what to look at on the round, and yesterday's site totals for
 * context. Oversight (charts, projections) is the manager's home instead.
 */
export function SupervisorHome({ data, today }: { data: GrowerDashboardData; today: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const firstName = user.name.split(" ")[0];
  const { overview, alerts } = data;
  const { site, batch, rollup, houses } = overview;

  // Has each house had its numbers entered for today yet? (No persistence in the
  // demo, so the round always starts fresh — every house is still "to record".)
  const toRecord = houses.filter((h) => h.latest?.date !== today);
  const done = houses.length - toRecord.length;
  const allDone = toRecord.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow={`${site.name} · Cycle ${batch.cycleNo} · ${batch.breed}`}
        title={`Morning, ${firstName}.`}
        intro={`${rollup.houseCount} houses to round today. ${countdownLabel(overview.killCountdownDays)}.`}
      />

      {/* The one job: today's round. */}
      <Card className="overflow-hidden">
        <div className="bg-brand-700 px-5 py-5 text-white sm:px-6">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-brand-100">Today&apos;s round</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-h1 text-white">
                {allDone ? "All houses recorded" : `${toRecord.length} of ${houses.length} houses to record`}
              </p>
              {!allDone ? (
                <p className="mt-1 text-body text-brand-100/90">{done > 0 ? `${done} done · ` : ""}Mortality, culls and feed per house.</p>
              ) : (
                <p className="mt-1 text-body text-brand-100/90">Today&apos;s numbers are in across the site.</p>
              )}
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/app/daily")}
              className="shrink-0"
            >
              {allDone ? "Open daily update" : "Start daily update"}
            </Button>
          </div>
        </div>

        <CardBody className="pt-4">
          <div className="flex flex-wrap gap-2" aria-label="Houses to record today">
            {houses.map((h) => {
              const recorded = h.latest?.date === today;
              return (
                <span
                  key={h.house.id}
                  className={
                    "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-label font-medium " +
                    (recorded ? "bg-status-good-tint text-status-good" : "border border-border bg-surface text-slate")
                  }
                >
                  {recorded ? <IconCheck className="size-3.5" /> : null}
                  {h.house.name}
                </span>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Other things to capture. */}
      <section className="space-y-3">
        <h2 className="text-h2">Also capture</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CaptureLink href="/app/daily" Icon={IconDailyUpdate} title="Daily update" body="Mortality, culls and feed, house by house." />
          <CaptureLink href="/app/feed" Icon={IconFeed} title="Feed delivery" body="Log a delivery and reconcile the weighed net." />
          <CaptureLink href="/app/weights" Icon={IconWeights} title="Weights" body="Record a weigh-in against the Ross target." />
          <CaptureLink href="/app/alerts" Icon={IconArrowRight} title="Alerts" body="What to watch on today's round." />
        </div>
      </section>

      {/* What to watch while rounding. */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h2">Needs attention</h2>
          <Link href="/app/alerts" className="text-label font-semibold text-brand-700 underline-offset-4 hover:text-brand-600 hover:underline">
            All alerts →
          </Link>
        </div>
        <AlertsList alerts={alerts} limit={2} moreHref="/app/alerts" />
      </section>

      <SiteRollupCard rollup={rollup} />
    </div>
  );
}

function CaptureLink({ href, Icon, title, body }: { href: string; Icon: IconComponent; title: string; body: string }) {
  return (
    <Link href={href} className="group rounded-[var(--radius-card)]">
      <Card interactive className="h-full">
        <CardBody className="flex items-start gap-3.5 pt-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-50 text-brand-700">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-h3">{title}</h3>
            <p className="mt-1 text-body text-slate">{body}</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
