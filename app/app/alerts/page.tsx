import { getAlerts } from "@/lib/data";
import { GrowerOnly } from "@/components/shell/GrowerOnly";
import { PageHeader } from "@/components/shell/PageHeader";
import { AlertsList } from "@/components/flock/AlertsList";
import { AlertsConvex } from "@/components/flock/AlertsConvex";

export default async function AlertsPage() {
  const alerts = process.env.NEXT_PUBLIC_CONVEX_URL ? null : await getAlerts();
  return (
    <GrowerOnly>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow="Alerts"
          title="Needs attention"
          intro="Houses the status engine has flagged, worst first — each with the likely cause and what to do next."
        />
        {alerts === null ? <AlertsConvex /> : <AlertsList alerts={alerts} />}
      </div>
    </GrowerOnly>
  );
}
