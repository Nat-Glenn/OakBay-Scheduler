// Only letters, spaces, hyphens, and apostrophes — no numbers in names
export const nameRegex = /^[a-zA-Z\s'\-]+$/;

// Basic email format check
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone: optional +, then digits/spaces/hyphens/dots/parens, 7–15 chars
export const phoneRegex = /^\+?[\d\s\-().]{7,15}$/;

export function parseIntStrict(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function parseNonEmptyString(value: unknown) {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

export function parseDate(value: unknown) {
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}