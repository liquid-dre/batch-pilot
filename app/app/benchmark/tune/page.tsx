import { redirect } from "next/navigation";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { BenchmarkWizard } from "@/components/contractor/BenchmarkWizard";

/**
 * `/app/benchmark/tune` — the contractor's benchmark tuning wizard (target
 * weight range, overlay bands, status thresholds). A Convex-mode feature; the
 * demo redirects to the read-only Current view.
 */
export default function Page() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) redirect("/app/benchmark");
  return (
    <ContractorOnly>
      <BenchmarkWizard />
    </ContractorOnly>
  );
}
