import { DEMO_TODAY, getFeedDeliveries } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { FeedDeliveryForm } from "@/components/forms/FeedDeliveryForm";
import { FeedConvex } from "@/components/flock/FeedConvex";

export default async function FeedPage() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <GrowerOnly>
        <FeedConvex />
      </GrowerOnly>
    );
  }

  const deliveries = await getFeedDeliveries();
  return (
    <GrowerOnly>
      <FeedDeliveryForm deliveries={deliveries} today={DEMO_TODAY} />
    </GrowerOnly>
  );
}
