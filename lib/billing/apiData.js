/**
 * Normalizes API JSON bodies that may be raw arrays or { data } wrappers.
 */

export function unwrapApiList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}
