import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}
export class NotFoundError extends Error {
  status = 404;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("You must be signed in.");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ForbiddenError("Admin access required.");
  return user;
}

/** Loads a device the current user owns (or any device, if the user is an admin). */
export async function requireOwnedDevice(deviceId: string) {
  const user = await requireUser();
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) throw new NotFoundError("Device not found.");
  if (device.ownerId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("You do not have access to this device.");
  }
  return { user, device };
}

/**
 * Resolves the device a request should act on: the explicit `deviceId` when
 * provided (with an ownership check), otherwise the current user's first
 * device. Returns `device: null` when the user has none yet, so callers can
 * render an empty state instead of erroring.
 */
export async function resolveRequestDevice(deviceId?: string | null) {
  const user = await requireUser();

  if (deviceId) {
    const { device } = await requireOwnedDevice(deviceId);
    return { user, device };
  }

  const device = await prisma.device.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return { user, device };
}
