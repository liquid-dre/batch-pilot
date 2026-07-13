import { getSupervisorCapture } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { SupervisorHome } from "@/components/flock/SupervisorHome";

/**
 * The daily round — the supervisor's one capture screen. Reached from the Home
 * dashboard's "Capture today's results" CTA and the nav. (The manager keeps its
 * own richer `/app/daily` form; this is the calm supervisor surface.)
 */
export default async function CapturePage() {
  const supervisor = await getSupervisorCapture();
  return (
    <GrowerOnly>
      <SupervisorHome data={supervisor} />
    </GrowerOnly>
  );
}
