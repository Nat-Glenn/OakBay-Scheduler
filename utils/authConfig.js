/**
 * Client-side check for dev auth bypass (must match lib/authConfig.ts).
 */

export function isAuthSkippedClient() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.NEXT_PUBLIC_SKIP_AUTH?.trim().toLowerCase() === "true";
}
