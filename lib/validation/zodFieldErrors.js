/**
 * Maps Zod flatten() output to a single message per form field for client UI.
 */

export function zodFieldErrors(error) {
  const flattened = error.flatten().fieldErrors;
  const result = {};

  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) result[field] = messages[0];
  }

  return result;
}
