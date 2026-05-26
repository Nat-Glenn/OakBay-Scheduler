/**
 * Turns API error JSON into a short message for the UI.
 */

export function parseApiError(data, fallback) {
  if (!data) return fallback;

  if (typeof data.error === "string" && data.error.trim()) {
    const fieldErrors = data.details?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstFieldMessage = Object.values(fieldErrors)
        .flat()
        .find((message) => typeof message === "string" && message.trim());
      if (firstFieldMessage) {
        return firstFieldMessage;
      }
    }
    return data.error;
  }

  return fallback;
}
