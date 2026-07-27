import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT = "scopegate-token-encryption"; // Static salt — key uniqueness comes from BETTER_AUTH_SECRET
const MIN_SECRET_LENGTH = 32;
// Known-public fallback values that used to ship as docker-compose defaults — never a valid secret.
const KNOWN_DEFAULT_SECRETS = new Set(["dev-secret-change-in-production"]);

function getKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for token encryption");
  }
  return pbkdf2Sync(secret, SALT, 100_000, 32, "sha256");
}

/** Throws if BETTER_AUTH_SECRET is missing, a known public default, or too short to be a real key. */
export function assertAuthSecretIsStrong(): void {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }
  if (KNOWN_DEFAULT_SECRETS.has(secret)) {
    throw new Error("BETTER_AUTH_SECRET is set to a known public default value — set a real secret");
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`BETTER_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
