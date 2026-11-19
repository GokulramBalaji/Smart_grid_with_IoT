import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const patchSchema = z.object({ role: z.enum(["ADMIN", "USER"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { role } = patchSchema.parse(await req.json());

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
