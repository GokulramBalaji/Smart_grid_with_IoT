import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UtilityTreeClient } from "@/components/utilities/UtilityTreeClient";

export default async function UtilitiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <UtilityTreeClient />;
}
