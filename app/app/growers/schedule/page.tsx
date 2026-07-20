import { Suspense } from "react";
import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { ScheduleCycleScreen } from "@/components/contractor/ScheduleCycleScreen";

// Contractor: schedule a cycle for one of their farms (cycles are contractor-
// owned, ROADMAP §9). Farm can be pre-selected via ?farm=<siteId>. Convex-only —
// the mock demo has no scheduling backend. `useSearchParams` inside the screen
// needs a Suspense boundary for static rendering.
export default function ScheduleCyclePage() {
  return (
    <ContractorOnly>
      <Suspense fallback={null}>
        <ScheduleCycleScreen />
      </Suspense>
    </ContractorOnly>
  );
}
