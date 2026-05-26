/**
 * Currency input helpers for checkout amounts (CAD, in-person visits).
 */

const MAX_AMOUNT = 99999.99;

export function formatCurrencyInput(value) {
  const raw = String(value ?? "").replace(/[^\d.]/g, "");
  if (!raw) return "";

  const dotIndex = raw.indexOf(".");
  if (dotIndex === -1) {
    return raw.slice(0, 5);
  }

  const intPart = raw.slice(0, dotIndex).slice(0, 5);
  const decPart = raw.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
  return decPart.length > 0 || raw.endsWith(".") ? `${intPart}.${decPart}` : intPart;
}

export function parseCurrencyAmount(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const rounded = Math.round(parsed * 100) / 100;
  if (rounded > MAX_AMOUNT) return null;
  return rounded;
}

export function formatCurrencyDisplay(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n);
}
