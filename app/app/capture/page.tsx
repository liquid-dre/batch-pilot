import { getSupervisorCapture } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { SupervisorHome } from "@/components/flock/SupervisorHome";
import { CaptureConvex } from "@/components/flock/CaptureConvex";

/**
 * The daily round — the supervisor's one capture screen. Reached from the Home
 * dashboard's capture CTA and the nav. Convex-connected: the reactive
 * capture + weigh-in panels; no backend: the mock capture surface.
 */
export default async function CapturePage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <CaptureConvex />
      </GrowerOnly>
    );
  }

  const supervisor = await getSupervisorCapture();
  return (
    <GrowerOnly>
      <SupervisorHome data={supervisor} />
    </GrowerOnly>
  );
}
