import { ContractorOnly } from "@/components/shell/ContractorOnly";
import { AddFarmScreen } from "@/components/contractor/AddFarmScreen";

// Contractor: onboard a new farm + invite its manager(s). Convex-only — the mock
// demo has no onboarding backend.
export default function AddFarmPage() {
  return (
    <ContractorOnly>
      <AddFarmScreen />
    </ContractorOnly>
  );
}
