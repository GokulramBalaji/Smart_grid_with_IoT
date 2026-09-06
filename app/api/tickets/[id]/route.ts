import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, NotFoundError, ForbiddenError } from "@/lib/session";
import { updateTicketSchema } from "@/lib/validations/utility";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const data = updateTicketSchema.parse(await req.json());

    const ticket = await prisma.ticket.findUnique({ where: { id }, include: { utilityNode: true } });
    if (!ticket) throw new NotFoundError("Ticket not found.");
    if (ticket.utilityNode.ownerId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenError("You do not have access to this ticket.");
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo || null } : {}),
        ...(data.status === "RESOLVED" || data.status === "CLOSED" ? { resolvedAt: new Date() } : {}),
      },
    });

    return apiSuccess({ ticket: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
