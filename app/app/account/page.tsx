import { redirect } from "next/navigation";
import { AccountScreen } from "@/components/account/AccountScreen";

/**
 * `/app/account` — self-service account (name, password, team). A real-user
 * feature, so it only exists when Convex is connected; the demo prototype has no
 * account to manage and redirects home.
 */
export default function Page() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) redirect("/app");
  return <AccountScreen />;
}
