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