import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminClient } from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return <AdminClient currentUserId={session.user.id} />;
}
