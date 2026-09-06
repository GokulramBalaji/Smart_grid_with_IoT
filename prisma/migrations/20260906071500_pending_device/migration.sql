
-- CreateTable
CREATE TABLE "PendingDevice" (
    "id" TEXT NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "wifiSsid" TEXT NOT NULL,
    "firmwareVersion" TEXT,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedByUserId" TEXT,
    "claimedUtilityNodeId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "lastAnnouncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingDevice_deviceIdentifier_key" ON "PendingDevice"("deviceIdentifier");

-- CreateIndex
CREATE INDEX "PendingDevice_claimed_lastAnnouncedAt_idx" ON "PendingDevice"("claimed", "lastAnnouncedAt");

-- AddForeignKey
ALTER TABLE "PendingDevice" ADD CONSTRAINT "PendingDevice_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

