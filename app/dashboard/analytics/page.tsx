import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const device = await prisma.device.findFirst({
    where: { utilityNode: { ownerId: session.user.id } },
    orderBy: { createdAt: "asc" },
  });

  if (!device) {
    return <EmptyState icon={Cpu} title="No devices connected yet" description="Add a device to see energy analytics." />;
  }

  return <AnalyticsClient deviceId={device.id} />;
}
