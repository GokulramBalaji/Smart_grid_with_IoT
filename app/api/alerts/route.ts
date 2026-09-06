import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import type { Prisma, AlertSeverity, AlertStatus, AlertType } from "@prisma/client";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const params = req.nextUrl.searchParams;

    const deviceId = params.get("deviceId");
    const status = params.get("status") as AlertStatus | null;
    const severity = params.get("severity") as AlertSeverity | null;
    const type = params.get("type") as AlertType | null;
    const search = params.get("search");
    const page = Math.max(1, Number(params.get("page") ?? 1));

    const where: Prisma.AlertWhereInput = {
      device: user.role === "ADMIN" ? undefined : { utilityNode: { ownerId: user.id } },
      ...(deviceId ? { deviceId } : {}),
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(type ? { type } : {}),
      ...(search ? { message: { contains: search, mode: "insensitive" } } : {}),
    };

    const [alerts, total, activeCounts] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: { device: { select: { name: true } } },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.alert.count({ where }),
      prisma.alert.groupBy({
        by: ["severity"],
        where: { device: user.role === "ADMIN" ? undefined : { utilityNode: { ownerId: user.id } }, status: "ACTIVE" },
        _count: true,
      }),
    ]);

    return apiSuccess({
      alerts,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      activeCounts: Object.fromEntries(activeCounts.map((c) => [c.severity, c._count])),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
