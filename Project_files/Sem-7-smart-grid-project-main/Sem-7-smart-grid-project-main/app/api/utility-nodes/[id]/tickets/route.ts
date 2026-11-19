import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { createTicketSchema } from "@/lib/validations/utility";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import type { TicketStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    const status = req.nextUrl.searchParams.get("status") as TicketStatus | null;

    const tickets = await prisma.ticket.findMany({
      where: { utilityNodeId: node.id, ...(status ? { status } : {}) },
      include: { createdBy: { select: { name: true } }, sourceAlert: { select: { id: true, type: true, severity: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, node } = await requireOwnedUtilityNode(id);
    const data = createTicketSchema.parse(await req.json());

    const ticket = await prisma.ticket.create({
      data: {
        utilityNodeId: node.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        assignedTo: data.assignedTo || null,
        createdById: user.id,
      },
    });

    return apiSuccess({ ticket }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
