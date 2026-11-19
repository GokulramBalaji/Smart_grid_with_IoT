-- Ephemeral one-time pickup for a freshly (re)generated plaintext device API
-- key, so an ESP32 can auto-fetch its key after being claimed instead of
-- requiring manual entry. Purely additive — no existing data is touched.
ALTER TABLE "Device" ADD COLUMN "pendingKeyPlaintext" TEXT;
ALTER TABLE "Device" ADD COLUMN "pendingKeyExpiresAt" TIMESTAMP(3);
