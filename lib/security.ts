import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a plaintext device API key of the form `sg_live_<32 hex chars>`.
 * The plaintext value is shown to the user exactly once; only its hash is
 * persisted, following the same pattern as GitHub/Stripe-style API tokens.
 */
export function generateDeviceApiKey(): { plaintext: string; prefix: string } {
  const random = crypto.randomBytes(24).toString("hex");
  const plaintext = `sg_live_${random}`;
  const prefix = `${plaintext.slice(0, 12)}...${plaintext.slice(-4)}`;
  return { plaintext, prefix };
}

export async function hashApiKey(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyApiKey(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
