import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { registerSchema } from "@/lib/validations/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { name: data.name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess({ user }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
