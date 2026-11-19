import { z } from "zod";

export const createUtilityNodeSchema = z.object({
  name: z.string().min(2).max(80),
  parentId: z.string().nullable().optional(),
});

export const updateUtilityNodeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  contractDemandKva: z.number().min(0).max(100_000).nullable().optional(),
});

const touRateSchema = z.object({
  label: z.string().min(1).max(40),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(24),
  rate: z.number().min(0),
});

const slabRateSchema = z.object({
  uptoKwh: z.number().min(0).nullable(), // null = unbounded top slab
  rate: z.number().min(0),
});

export const tariffPlanSchema = z
  .object({
    name: z.string().min(2).max(80),
    type: z.enum(["FLAT", "TIME_OF_USE", "SLAB"]),
    currency: z.string().min(1).max(8).default("USD"),
    flatRate: z.number().min(0).nullable().optional(),
    touRates: z.array(touRateSchema).nullable().optional(),
    slabRates: z.array(slabRateSchema).nullable().optional(),
    fixedChargeMonthly: z.number().min(0).default(0),
    demandChargePerKva: z.number().min(0).default(0),
  })
  .refine((data) => data.type !== "FLAT" || typeof data.flatRate === "number", {
    message: "flatRate is required for a FLAT tariff",
    path: ["flatRate"],
  })
  .refine((data) => data.type !== "TIME_OF_USE" || (data.touRates && data.touRates.length > 0), {
    message: "touRates is required for a TIME_OF_USE tariff",
    path: ["touRates"],
  })
  .refine((data) => data.type !== "SLAB" || (data.slabRates && data.slabRates.length > 0), {
    message: "slabRates is required for a SLAB tariff",
    path: ["slabRates"],
  });

export const createTicketSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(1).max(4000),
  category: z.enum(["COMPLAINT", "MAINTENANCE", "INSPECTION", "OTHER"]).default("COMPLAINT"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedTo: z.string().max(120).optional().or(z.literal("")),
});

export const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().max(120).optional().or(z.literal("")),
});

export const createServiceRecordSchema = z.object({
  type: z.enum(["ROUTINE", "REPAIR", "INSPECTION", "CALIBRATION", "OTHER"]).default("ROUTINE"),
  description: z.string().min(1).max(2000),
  performedBy: z.string().min(1).max(120),
  performedAt: z.string().datetime().optional(),
  cost: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type TariffPlanInput = z.infer<typeof tariffPlanSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateServiceRecordInput = z.infer<typeof createServiceRecordSchema>;
