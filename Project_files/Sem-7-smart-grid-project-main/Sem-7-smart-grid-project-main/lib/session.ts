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

/**
 * Loads a device the current user owns (or any device, if admin). Ownership
 * flows through the device's UtilityNode — a device is never owned directly
 * by a user, only via the utility/sub-utility node it's attached to.
 */
export async function requireOwnedDevice(deviceId: string) {
  const user = await requireUser();
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { utilityNode: true },
  });
  if (!device) throw new NotFoundError("Device not found.");
  if (device.utilityNode.ownerId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("You do not have access to this device.");
  }
  return { user, device };
}

/**
 * Resolves the device a request should act on: the explicit `deviceId` when
 * provided (with an ownership check), otherwise the current user's
 * earliest-created utility node that has a device attached. Returns
 * `device: null` when the user has none yet, so callers can render an empty
 * state instead of erroring.
 */
export async function resolveRequestDevice(deviceId?: string | null) {
  const user = await requireUser();

  if (deviceId) {
    const { device } = await requireOwnedDevice(deviceId);
    return { user, device };
  }

  const device = await prisma.device.findFirst({
    where: { utilityNode: { ownerId: user.id } },
    orderBy: { createdAt: "asc" },
  });
  return { user, device };
}

/** Loads a utility/sub-utility node the current user owns (or any, if admin). */
export async function requireOwnedUtilityNode(nodeId: string) {
  const user = await requireUser();
  const node = await prisma.utilityNode.findUnique({
    where: { id: nodeId },
    include: { device: true },
  });
  if (!node) throw new NotFoundError("Utility not found.");
  if (node.ownerId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("You do not have access to this utility.");
  }
  return { user, node };
}

/**
 * Resolves the utility node a request should act on: the explicit `nodeId`
 * when provided, otherwise the current user's earliest-created root node
 * (no parent). Returns `node: null` when the user has none yet.
 */
export async function resolveRequestUtilityNode(nodeId?: string | null) {
  const user = await requireUser();

  if (nodeId) {
    const { node } = await requireOwnedUtilityNode(nodeId);
    return { user, node };
  }

  const node = await prisma.utilityNode.findFirst({
    where: { ownerId: user.id, parentId: null },
    orderBy: { createdAt: "asc" },
    include: { device: true },
  });
  return { user, node };
}
