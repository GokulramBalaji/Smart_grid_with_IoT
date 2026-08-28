import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, NotFoundError, ForbiddenError } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const { status } = patchSchema.parse(await req.json());

    const alert = await prisma.alert.findUnique({ where: { id }, include: { device: true } });
    if (!alert) throw new NotFoundError("Alert not found.");
    if (alert.device.ownerId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenError("You do not have access to this alert.");
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status,
        acknowledgedById: status === "ACKNOWLEDGED" ? user.id : alert.acknowledgedById,
        acknowledgedAt: status === "ACKNOWLEDGED" ? new Date() : alert.acknowledgedAt,
        resolvedAt: status === "RESOLVED" ? new Date() : alert.resolvedAt,
      },
    });

    return apiSuccess({ alert: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
