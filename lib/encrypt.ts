import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM field-level encryption for sensitive patient data (ahcNumber).
// Key must be a 64-character hex string (32 bytes) stored in ENCRYPTION_KEY env variable.
// Format stored in DB: enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY ?? "";
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string. " +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  // Generate a unique 96-bit IV for every encryption — never reuse IVs with GCM
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  // 128-bit authentication tag — detects tampering
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decrypt(value: string): string {
  // Backwards-compatible: if value has no prefix it was stored before encryption was added
  if (!value.startsWith(PREFIX)) return value;

  const key = getKey();
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted field format");

  const [ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const data = Buffer.from(dataHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(data).toString("utf8") + decipher.final("utf8");
}

// Null-safe wrappers — use these in route files instead of encrypt/decrypt directly
export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  return encrypt(value);
}

export function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  return decrypt(value);
}