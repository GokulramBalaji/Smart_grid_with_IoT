import { z } from "zod";

export const createDeviceSchema = z.object({
  name: z.string().min(2).max(80),
  deviceIdentifier: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, hyphens and underscores"),
  location: z.string().max(120).optional().or(z.literal("")),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  location: z.string().max(120).optional().or(z.literal("")),
  demoMode: z.boolean().optional(),
});

export const systemConfigSchema = z.object({
  maxVoltage: z.number().min(1).max(1000),
  minVoltage: z.number().min(1).max(1000),
  maxCurrent: z.number().min(0.1).max(500),
  maxPower: z.number().min(1).max(1_000_000),
  maxImbalance: z.number().min(0).max(100),
  minPowerFactor: z.number().min(0).max(1),
  notifyHighVoltage: z.boolean(),
  notifyLowVoltage: z.boolean(),
  notifyOvercurrent: z.boolean(),
  notifyImbalance: z.boolean(),
  notifyPoorPF: z.boolean(),
  notifyDeviceOffline: z.boolean(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type SystemConfigInput = z.infer<typeof systemConfigSchema>;
