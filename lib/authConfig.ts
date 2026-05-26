/**
 * Dev-only auth bypass — set NEXT_PUBLIC_SKIP_AUTH=true in .env.local while
 * Firebase credentials are unavailable. Never enabled in production builds.
 */

export function isAuthSkipped(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.NEXT_PUBLIC_SKIP_AUTH?.trim().toLowerCase() === "true";
}

/**
 * Map any Firebase sign-in (e.g. personal Gmail) to Brad Pritchard admin until
 * real clinic emails exist on User rows. Dev only.
 */
export function shouldImpersonateAdmin(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return (
    process.env.NEXT_PUBLIC_IMPERSONATE_ADMIN?.trim().toLowerCase() === "true"
  );
}
