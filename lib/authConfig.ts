/**
 * Dev-only auth bypass — set NEXT_PUBLIC_SKIP_AUTH=true in .env.local while
 * Firebase credentials are unavailable. Never enabled in production builds.
 */

export function isAuthSkipped(): boolean {
  // Only honor this flag in local dev — never set NEXT_PUBLIC_SKIP_AUTH in production.
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.NEXT_PUBLIC_SKIP_AUTH?.trim().toLowerCase() === "true";
}
