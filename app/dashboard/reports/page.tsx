import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClient } from "@/components/reports/ReportsClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu } from "lucide-react";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const device = await prisma.device.findFirst({
    where: { utilityNode: { ownerId: session.user.id } },
    orderBy: { createdAt: "asc" },
  });

  if (!device) {
    return <EmptyState icon={Cpu} title="No devices connected yet" description="Add a device to generate reports." />;
  }

  return <ReportsClient deviceId={device.id} />;
}
