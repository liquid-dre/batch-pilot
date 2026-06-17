import { redirect } from "next/navigation";

/** The portfolio rankings are now the contractor Overview at /app. */
export default function PortfolioRedirect() {
  redirect("/app");
}
