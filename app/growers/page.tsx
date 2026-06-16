import Link from "next/link";
import { getPortfolio, getSite } from "@/lib/data";
import { num, pct, shortDate } from "@/lib/format";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/shell/PageHeader";

export default async function GrowersPage() {
  const [site, portfolio] = await Promise.all([getSite(), getPortfolio()]);
  const { summary } = portfolio;

  return (
    <ContractorOnly>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Growers"
          title="Your growers"
          intro="Sites supplying this contractor. Open a grower for per-house detail, trends and track record."
        />
        <Link href={`/growers/${site.id}`} className="block rounded-[var(--radius-card)]">
          <Card interactive>
            <CardBody className="flex items-center justify-between gap-4 pt-5">
              <div>
                <CardEyebrow>{summary.farmCode}/0{summary.cycleNo}</CardEyebrow>
                <p className="mt-1.5 text-h3">{site.name}</p>
                <p className="text-label text-muted">
                  {summary.houseCount} houses · {num(summary.birdsOnSite)} birds · {pct(summary.avgMortPct)} mortality · kill {shortDate(summary.killDate)}
                </p>
              </div>
              <StatusPill level={summary.level} />
            </CardBody>
          </Card>
        </Link>
      </div>
    </ContractorOnly>
  );
}
