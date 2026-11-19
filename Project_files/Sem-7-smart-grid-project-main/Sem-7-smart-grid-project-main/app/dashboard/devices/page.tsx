import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DevicesClient } from "@/components/devices/DevicesClient";

export default async function DevicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <DevicesClient />;
}
