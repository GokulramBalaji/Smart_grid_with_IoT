import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/security";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

const updateSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .optional(),
  })
  .refine((data) => !data.newPassword || !!data.currentPassword, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"],
  });

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const data = updateSchema.parse(await req.json());

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

    if (data.newPassword) {
      const valid = await verifyPassword(data.currentPassword!, user.passwordHash);
      if (!valid) return apiError("Current password is incorrect.", 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.newPassword ? { passwordHash: await hashPassword(data.newPassword) } : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
