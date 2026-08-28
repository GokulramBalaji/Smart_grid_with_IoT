import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const device = await prisma.device.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SettingsClient
      user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}
      deviceId={device?.id ?? null}
    />
  );
}
