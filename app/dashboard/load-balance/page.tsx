import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoadBalanceClient } from "@/components/load-balance/LoadBalanceClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu } from "lucide-react";

export default async function LoadBalancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const device = await prisma.device.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!device) {
    return <EmptyState icon={Cpu} title="No devices connected yet" description="Add a device to see load balance insights." />;
  }

  return <LoadBalanceClient deviceId={device.id} />;
}
