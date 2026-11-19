import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Cpu } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const device = await prisma.device.findFirst({
    where: { utilityNode: { ownerId: session.user.id } },
    orderBy: { createdAt: "asc" },
  });

  if (!device) {
    return (
      <EmptyState
        icon={Cpu}
        title="No devices connected yet"
        description="Add your ESP32 + PZEM device to start receiving live three-phase readings, or enable Demo Mode to explore the platform with simulated data."
        action={
          <Link href="/dashboard/devices">
            <Button>Add a device</Button>
          </Link>
        }
      />
    );
  }

  return <DashboardClient deviceId={device.id} userName={session.user.name ?? "there"} />;
}
