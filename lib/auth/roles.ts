/**
 * Normalized app roles for permissions. Maps from User.role + admin emails.
 */

export const AppRole = {
  ADMIN: "admin",
  CHIROPRACTOR: "chiropractor",
  RECEPTIONIST: "receptionist",
} as const;

export type AppRoleValue = (typeof AppRole)[keyof typeof AppRole];

/** Clinic owner / lead — full access including team management. */
const ADMIN_EMAILS = new Set(["brad.pritchard@oakbay.com"]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

/** Maps database User.role (and email for admin) to app permission roles. */
export function normalizeDbRole(
  dbRole: string | null | undefined,
  email?: string | null,
): AppRoleValue {
  if (isAdminEmail(email)) {
    return AppRole.ADMIN;
  }

  const value = String(dbRole ?? "").trim().toLowerCase();

  if (value === "chiropractor" || value === "provider") {
    return AppRole.CHIROPRACTOR;
  }

  if (value === "receptionist") {
    return AppRole.RECEPTIONIST;
  }

  return AppRole.RECEPTIONIST;
}

export function roleLabel(role: AppRoleValue): string {
  switch (role) {
    case AppRole.ADMIN:
      return "Administrator";
    case AppRole.CHIROPRACTOR:
      return "Chiropractor";
    case AppRole.RECEPTIONIST:
      return "Receptionist";
    default:
      return "Staff";
  }
}
