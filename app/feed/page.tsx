import { DEMO_TODAY, getFeedDeliveries } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { FeedDeliveryForm } from "@/components/forms/FeedDeliveryForm";

export default async function FeedPage() {
  const deliveries = await getFeedDeliveries();
  return (
    <GrowerOnly>
      <FeedDeliveryForm deliveries={deliveries} today={DEMO_TODAY} />
    </GrowerOnly>
  );
}
