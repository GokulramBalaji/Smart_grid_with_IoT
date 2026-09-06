import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import type { Prisma, Phase } from "@prisma/client";

const PAGE_SIZE = 25;
const SORTABLE_FIELDS = new Set(["timestamp", "voltage", "current", "activePower", "powerFactor", "energy"]);

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const params = req.nextUrl.searchParams;

    const deviceId = params.get("deviceId");
    const phase = params.get("phase") as Phase | null;
    const from = params.get("from");
    const to = params.get("to");
    const search = params.get("search");
    const sortField = params.get("sortField") ?? "timestamp";
    const sortDir = params.get("sortDir") === "asc" ? "asc" : "desc";
    const page = Math.max(1, Number(params.get("page") ?? 1));

    const where: Prisma.SensorReadingWhereInput = {
      device: {
        ...(user.role === "ADMIN" ? {} : { utilityNode: { ownerId: user.id } }),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      ...(deviceId ? { deviceId } : {}),
      ...(phase ? { phase } : {}),
      ...(from || to
        ? {
            timestamp: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const orderBy = { [SORTABLE_FIELDS.has(sortField) ? sortField : "timestamp"]: sortDir };

    const [readings, total] = await Promise.all([
      prisma.sensorReading.findMany({
        where,
        include: { device: { select: { name: true } } },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.sensorReading.count({ where }),
    ]);

    return apiSuccess({
      readings,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
