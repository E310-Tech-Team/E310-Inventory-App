import crypto from "crypto";

const HASH_ALGORITHM = "sha256";
const HASH_KEYLEN = 64;
const HASH_SALT_BYTES = 16;
const HASH_ITERATIONS = 310000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(HASH_SALT_BYTES).toString("hex");
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_ALGORITHM)
    .toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, derivedKey] = storedHash.split(":");
  if (!salt || !derivedKey) {
    return false;
  }

  const attempt = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_ALGORITHM)
    .toString("hex");

  const keyBuffer = Buffer.from(derivedKey, "hex");
  const attemptBuffer = Buffer.from(attempt, "hex");

  if (keyBuffer.length !== attemptBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(keyBuffer, attemptBuffer);
}
