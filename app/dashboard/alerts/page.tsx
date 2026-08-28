import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AlertsClient } from "@/components/alerts/AlertsClient";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <AlertsClient />;
}
