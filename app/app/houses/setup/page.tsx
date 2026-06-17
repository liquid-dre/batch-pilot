import { redirect } from "next/navigation";

/** Setup moved to /app/houses; keep old links working. */
export default function HouseSetupRedirect() {
  redirect("/app/houses");
}
