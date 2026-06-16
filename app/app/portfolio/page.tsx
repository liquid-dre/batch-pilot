import { getPortfolio, getSite } from "@/lib/data";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { PortfolioDashboard } from "@/components/contractor/PortfolioDashboard";

export default async function PortfolioPage() {
  const [portfolio, site] = await Promise.all([getPortfolio(), getSite()]);
  return (
    <ContractorOnly>
      <PortfolioDashboard data={portfolio} siteId={site.id} />
    </ContractorOnly>
  );
}
