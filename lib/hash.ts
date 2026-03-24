import bcrypt from "bcryptjs";

// Password hashing using bcrypt.
// Cost factor 12 is the OWASP minimum recommendation.
// Firebase Auth handles actual login — this protects the User.password field in the DB.

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Checks if a value is already a bcrypt hash — prevents double-hashing on seed reruns
export function isHashed(value: string): boolean {
  return value.startsWith("$2a$") || value.startsWith("$2b$");
}