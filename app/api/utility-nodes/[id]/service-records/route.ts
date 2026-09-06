import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { createServiceRecordSchema } from "@/lib/validations/utility";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);

    const records = await prisma.serviceRecord.findMany({
      where: { utilityNodeId: node.id },
      orderBy: { performedAt: "desc" },
    });

    return apiSuccess({ records });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    const data = createServiceRecordSchema.parse(await req.json());

    const record = await prisma.serviceRecord.create({
      data: {
        utilityNodeId: node.id,
        type: data.type,
        description: data.description,
        performedBy: data.performedBy,
        performedAt: data.performedAt ? new Date(data.performedAt) : new Date(),
        cost: data.cost ?? null,
        notes: data.notes || null,
      },
    });

    return apiSuccess({ record }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
