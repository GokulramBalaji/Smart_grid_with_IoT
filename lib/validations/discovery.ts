import { z } from "zod";

export const announceDeviceSchema = z.object({
  deviceIdentifier: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, hyphens and underscores"),
  wifiSsid: z.string().min(1).max(64),
  firmwareVersion: z.string().max(32).optional(),
});

export const claimPendingDeviceSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("new"),
    name: z.string().min(2).max(80),
    parentId: z.string().nullable().optional(),
    deviceName: z.string().min(2).max(80),
    location: z.string().max(120).optional().or(z.literal("")),
  }),
  z.object({
    mode: z.literal("existing"),
    utilityNodeId: z.string().min(1),
    deviceName: z.string().min(2).max(80),
    location: z.string().max(120).optional().or(z.literal("")),
  }),
]);

export type AnnounceDeviceInput = z.infer<typeof announceDeviceSchema>;
export type ClaimPendingDeviceInput = z.infer<typeof claimPendingDeviceSchema>;
