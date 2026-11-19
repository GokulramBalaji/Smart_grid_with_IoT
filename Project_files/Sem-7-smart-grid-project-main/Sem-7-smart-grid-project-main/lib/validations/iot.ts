import { z } from "zod";

// Bounds are intentionally generous but reject physically impossible values
// (negative voltage, current beyond any PZEM-004T range, etc.) so a malformed
// or malicious payload never reaches the database.
const phaseInputSchema = z.object({
  voltage: z.number().min(0).max(500),
  current: z.number().min(0).max(200),
  power: z.number().min(0).max(100000),
  energy: z.number().min(0).max(1_000_000),
  frequency: z.number().min(40).max(70),
  powerFactor: z.number().min(0).max(1),
  apparentPower: z.number().min(0).max(100000).optional(),
  reactivePower: z.number().min(0).max(100000).optional(),
});

export const deviceIngestSchema = z.object({
  deviceId: z.string().min(3).max(128),
  timestamp: z.string().datetime().optional(),
  phases: z.object({
    R: phaseInputSchema,
    Y: phaseInputSchema,
    B: phaseInputSchema,
  }),
});

export type DeviceIngestInput = z.infer<typeof deviceIngestSchema>;
