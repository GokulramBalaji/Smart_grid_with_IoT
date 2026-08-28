import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/security";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always respond with 200 regardless of whether the account exists, to
    // avoid leaking which emails are registered.
    if (!user) {
      return apiSuccess({ message: "If an account exists, a reset link has been generated." });
    }

    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    // No transactional email provider is configured in this project yet, so
    // the reset link is returned directly in the API response for local/demo
    // use. Wire up a real email provider (Resend, SES, Postmark, ...) before
    // shipping this to production and remove `resetUrl` from the response.
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

    return apiSuccess({
      message: "If an account exists, a reset link has been generated.",
      resetUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
