/**
 * Sanitizes person-name input to match server validation (letters, spaces, hyphens, apostrophes).
 */

export const PERSON_NAME_MAX_LENGTH = 50;

const INVALID_NAME_CHARS = /[^a-zA-Z\s'\-]/g;

export function sanitizePersonNameInput(
  value,
  maxLength = PERSON_NAME_MAX_LENGTH,
) {
  return String(value).replace(INVALID_NAME_CHARS, "").slice(0, maxLength);
}
