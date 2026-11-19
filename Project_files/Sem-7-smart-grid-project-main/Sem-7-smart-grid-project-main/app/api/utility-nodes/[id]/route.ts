import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { updateUtilityNodeSchema } from "@/lib/validations/utility";
import { computeConnectionStatus } from "@/lib/calculations/dashboard";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);

    const [device, children, tariffPlan, openTicketCount] = await Promise.all([
      node.device
        ? prisma.device.findUnique({ where: { id: node.device.id } })
        : Promise.resolve(null),
      prisma.utilityNode.findMany({
        where: { parentId: node.id },
        orderBy: { createdAt: "asc" },
        include: { device: { select: { id: true, name: true, status: true, lastSeenAt: true } } },
      }),
      prisma.tariffPlan.findUnique({ where: { utilityNodeId: node.id } }),
      prisma.ticket.count({ where: { utilityNodeId: node.id, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]);

    return apiSuccess({
      node: {
        id: node.id,
        name: node.name,
        parentId: node.parentId,
        contractDemandKva: node.contractDemandKva,
        createdAt: node.createdAt,
      },
      device: device ? { ...device, connectionStatus: computeConnectionStatus(device) } : null,
      children: children.map((c) => ({
        ...c,
        device: c.device ? { ...c.device, connectionStatus: computeConnectionStatus(c.device) } : null,
      })),
      tariffPlan,
      openTicketCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    const data = updateUtilityNodeSchema.parse(await req.json());

    const updated = await prisma.utilityNode.update({
      where: { id: node.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.contractDemandKva !== undefined ? { contractDemandKva: data.contractDemandKva } : {}),
      },
    });

    return apiSuccess({ node: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    await prisma.utilityNode.delete({ where: { id: node.id } });
    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
