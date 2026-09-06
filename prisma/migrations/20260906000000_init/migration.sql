warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'PROVISIONING');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('R', 'Y', 'B');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('HIGH_VOLTAGE', 'LOW_VOLTAGE', 'OVERCURRENT', 'PHASE_IMBALANCE', 'POOR_POWER_FACTOR', 'FREQUENCY_ABNORMAL', 'DEVICE_OFFLINE', 'COMMUNICATION_FAILURE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SummaryPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TariffType" AS ENUM ('FLAT', 'TIME_OF_USE', 'SLAB');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('COMPLAINT', 'MAINTENANCE', 'INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ServiceRecordType" AS ENUM ('ROUTINE', 'REPAIR', 'INSPECTION', 'CALIBRATION', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,
    "contractDemandKva" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffPlan" (
    "id" TEXT NOT NULL,
    "utilityNodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TariffType" NOT NULL DEFAULT 'FLAT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "flatRate" DOUBLE PRECISION,
    "touRates" JSONB,
    "slabRates" JSONB,
    "fixedChargeMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demandChargePerKva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "utilityNodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'COMPLAINT',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "sourceAlertId" TEXT,
    "createdById" TEXT,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL,
    "utilityNodeId" TEXT NOT NULL,
    "type" "ServiceRecordType" NOT NULL DEFAULT 'ROUTINE',
    "description" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyPrefix" TEXT NOT NULL,
    "location" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'PROVISIONING',
    "demoMode" BOOLEAN NOT NULL DEFAULT false,
    "wifiSignal" INTEGER,
    "lastSeenAt" TIMESTAMP(3),
    "firmwareVersion" TEXT,
    "utilityNodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phase" "Phase" NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "activePower" DOUBLE PRECISION NOT NULL,
    "apparentPower" DOUBLE PRECISION NOT NULL,
    "reactivePower" DOUBLE PRECISION NOT NULL,
    "powerFactor" DOUBLE PRECISION NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "energyDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "phase" "Phase",
    "message" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergySummary" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "period" "SummaryPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "energyR" DOUBLE PRECISION NOT NULL,
    "energyY" DOUBLE PRECISION NOT NULL,
    "energyB" DOUBLE PRECISION NOT NULL,
    "totalEnergy" DOUBLE PRECISION NOT NULL,
    "avgPowerFactor" DOUBLE PRECISION NOT NULL,
    "avgVoltage" DOUBLE PRECISION NOT NULL,
    "avgCurrent" DOUBLE PRECISION NOT NULL,
    "peakPower" DOUBLE PRECISION NOT NULL,
    "minVoltage" DOUBLE PRECISION NOT NULL,
    "maxVoltage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "maxVoltage" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "minVoltage" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "maxCurrent" DOUBLE PRECISION NOT NULL DEFAULT 32,
    "maxPower" DOUBLE PRECISION NOT NULL DEFAULT 7000,
    "maxImbalance" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "minPowerFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "notifyHighVoltage" BOOLEAN NOT NULL DEFAULT true,
    "notifyLowVoltage" BOOLEAN NOT NULL DEFAULT true,
    "notifyOvercurrent" BOOLEAN NOT NULL DEFAULT true,
    "notifyImbalance" BOOLEAN NOT NULL DEFAULT true,
    "notifyPoorPF" BOOLEAN NOT NULL DEFAULT true,
    "notifyDeviceOffline" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UtilityNode_ownerId_idx" ON "UtilityNode"("ownerId");

-- CreateIndex
CREATE INDEX "UtilityNode_parentId_idx" ON "UtilityNode"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "TariffPlan_utilityNodeId_key" ON "TariffPlan"("utilityNodeId");

-- CreateIndex
CREATE INDEX "Ticket_utilityNodeId_status_idx" ON "Ticket"("utilityNodeId", "status");

-- CreateIndex
CREATE INDEX "Ticket_sourceAlertId_idx" ON "Ticket"("sourceAlertId");

-- CreateIndex
CREATE INDEX "ServiceRecord_utilityNodeId_performedAt_idx" ON "ServiceRecord"("utilityNodeId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceIdentifier_key" ON "Device"("deviceIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "Device_utilityNodeId_key" ON "Device"("utilityNodeId");

-- CreateIndex
CREATE INDEX "Device_utilityNodeId_idx" ON "Device"("utilityNodeId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "SensorReading_deviceId_timestamp_idx" ON "SensorReading"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "SensorReading_deviceId_phase_timestamp_idx" ON "SensorReading"("deviceId", "phase", "timestamp");

-- CreateIndex
CREATE INDEX "Alert_deviceId_status_idx" ON "Alert"("deviceId", "status");

-- CreateIndex
CREATE INDEX "Alert_deviceId_timestamp_idx" ON "Alert"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "EnergySummary_deviceId_period_periodStart_idx" ON "EnergySummary"("deviceId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "EnergySummary_deviceId_period_periodStart_key" ON "EnergySummary"("deviceId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_deviceId_key" ON "SystemConfig"("deviceId");

-- AddForeignKey
ALTER TABLE "UtilityNode" ADD CONSTRAINT "UtilityNode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityNode" ADD CONSTRAINT "UtilityNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "UtilityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffPlan" ADD CONSTRAINT "TariffPlan_utilityNodeId_fkey" FOREIGN KEY ("utilityNodeId") REFERENCES "UtilityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_utilityNodeId_fkey" FOREIGN KEY ("utilityNodeId") REFERENCES "UtilityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_sourceAlertId_fkey" FOREIGN KEY ("sourceAlertId") REFERENCES "Alert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_utilityNodeId_fkey" FOREIGN KEY ("utilityNodeId") REFERENCES "UtilityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_utilityNodeId_fkey" FOREIGN KEY ("utilityNodeId") REFERENCES "UtilityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergySummary" ADD CONSTRAINT "EnergySummary_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

