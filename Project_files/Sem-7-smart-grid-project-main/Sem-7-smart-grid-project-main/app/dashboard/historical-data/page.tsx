import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HistoricalDataClient } from "@/components/historical/HistoricalDataClient";

export default async function HistoricalDataPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <HistoricalDataClient />;
}
