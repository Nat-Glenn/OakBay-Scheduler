/**
 * Turns API error JSON into a short message for the UI.
 */

export function parseApiError(data, fallback) {
  if (!data) return fallback;

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  return fallback;
}
