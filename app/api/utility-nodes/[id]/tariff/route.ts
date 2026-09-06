import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { tariffPlanSchema } from "@/lib/validations/utility";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    const tariff = await prisma.tariffPlan.findUnique({ where: { utilityNodeId: node.id } });
    return apiSuccess({ tariff });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    const parsed = tariffPlanSchema.parse(await req.json());
    const data = {
      name: parsed.name,
      type: parsed.type,
      currency: parsed.currency,
      flatRate: parsed.flatRate ?? null,
      touRates: parsed.touRates ?? Prisma.JsonNull,
      slabRates: parsed.slabRates ?? Prisma.JsonNull,
      fixedChargeMonthly: parsed.fixedChargeMonthly,
      demandChargePerKva: parsed.demandChargePerKva,
    };

    const tariff = await prisma.tariffPlan.upsert({
      where: { utilityNodeId: node.id },
      update: data,
      create: { ...data, utilityNodeId: node.id },
    });

    return apiSuccess({ tariff });
  } catch (error) {
    return handleApiError(error);
  }
}
