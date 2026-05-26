/**
 * Shared payment method labels for cards on file, checkout, and billing history.
 */

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "American Express" },
  { value: "debit", label: "Debit" },
];

export const CARD_BRAND_OPTIONS = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "Amex", label: "American Express" },
  { value: "Debit", label: "Debit" },
];

const BRAND_TO_PAYMENT_TYPE = {
  visa: "visa",
  mastercard: "mastercard",
  amex: "amex",
  "american express": "amex",
  debit: "debit",
};

/** Maps a card-on-file brand to POST /api/payments paymentType. */
export function paymentTypeFromCardBrand(brand) {
  const key = String(brand || "")
    .trim()
    .toLowerCase();
  return BRAND_TO_PAYMENT_TYPE[key] ?? "visa";
}

export function paymentTypeLabel(paymentType) {
  const normalized = String(paymentType || "").toLowerCase();
  const match = PAYMENT_METHOD_OPTIONS.find((o) => o.value === normalized);
  return match?.label ?? paymentType ?? "—";
}

export function isCardExpired(expMonth, expYear) {
  if (!expMonth || !expYear) return false;
  const month = Number(expMonth);
  let year = Number(expYear);
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(year)) return false;
  if (year < 100) year += 2000;

  const now = new Date();
  const nowIndex = now.getFullYear() * 12 + now.getMonth() + 1;
  const expIndex = year * 12 + month;
  return expIndex < nowIndex;
}
