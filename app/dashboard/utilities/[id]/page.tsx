import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UtilityDetailClient } from "@/components/utilities/UtilityDetailClient";

export default async function UtilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return <UtilityDetailClient nodeId={id} />;
}
