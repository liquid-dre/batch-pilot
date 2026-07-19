import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { CollectionConvex } from "@/components/flock/CollectionConvex";
import { ScreenEmpty } from "@/components/shell/ScreenState";

/** Supervisor collection — record catches + gate-verify (Convex-only; the mock
 *  prototype has no collection-capture path). */
export default function CollectionPage() {
  return (
    <GrowerOnly>
      {process.env.NEXT_PUBLIC_CONVEX_URL ? (
        <CollectionConvex />
      ) : (
        <ScreenEmpty
          eyebrow="Collection"
          title="Tonight's catch"
          heading="Available with the live backend"
          body="Recording catches and verifying trucks runs on the connected backend."
        />
      )}
    </GrowerOnly>
  );
}
