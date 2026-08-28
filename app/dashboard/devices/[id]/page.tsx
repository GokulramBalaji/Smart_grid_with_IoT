import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeviceDetailClient } from "@/components/devices/DeviceDetailClient";

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return <DeviceDetailClient deviceId={id} />;
}
