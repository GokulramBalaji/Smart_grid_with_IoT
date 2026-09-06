import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOwnedUtilityNode } from "@/lib/session";
import { createUtilityNodeSchema } from "@/lib/validations/utility";
import { computeConnectionStatus } from "@/lib/calculations/dashboard";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();

    const nodes = await prisma.utilityNode.findMany({
      where: user.role === "ADMIN" ? {} : { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      include: {
        device: { select: { id: true, name: true, deviceIdentifier: true, status: true, lastSeenAt: true } },
        _count: { select: { children: true, tickets: true } },
      },
    });

    return apiSuccess({
      nodes: nodes.map((n) => ({
        ...n,
        device: n.device ? { ...n.device, connectionStatus: computeConnectionStatus(n.device) } : null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = createUtilityNodeSchema.parse(await req.json());

    if (data.parentId) {
      await requireOwnedUtilityNode(data.parentId);
    }

    const node = await prisma.utilityNode.create({
      data: { name: data.name, ownerId: user.id, parentId: data.parentId ?? null },
    });

    return apiSuccess({ node }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
