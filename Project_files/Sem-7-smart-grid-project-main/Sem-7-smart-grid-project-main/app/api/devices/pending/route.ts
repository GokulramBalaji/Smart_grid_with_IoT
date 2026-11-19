import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireUser();

    const pending = await prisma.pendingDevice.findMany({
      where: { claimed: false },
      orderBy: { lastAnnouncedAt: "desc" },
    });

    return apiSuccess({ pending });
  } catch (error) {
    return handleApiError(error);
  }
}
