/**
 * North American phone display formatting for form inputs.
 * Formats up to 10 digits as XXX-XXX-XXXX while the user types.
 */

export const NORTH_AMERICAN_PHONE_DISPLAY_MAX = 12;

export function formatNorthAmericanPhone(value) {
  const digits = String(value).replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function countPhoneDigits(value) {
  return String(value).replace(/\D/g, "").length;
}
