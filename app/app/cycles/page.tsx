import { redirect } from "next/navigation";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { CyclesConvex } from "@/components/flock/CyclesConvex";

/**
 * `/app/cycles` — the grower's read-only view of the cycles their contractor
 * scheduled (upcoming + ongoing). A Convex-mode feature; the demo redirects home.
 */
export default function Page() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) redirect("/app");
  return (
    <GrowerOnly>
      <CyclesConvex />
    </GrowerOnly>
  );
}
