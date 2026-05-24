/**
 * Canonical clinic staff roles stored on User.role in the database.
 */

export const ClinicDbRole = {
  CHIROPRACTOR: "Chiropractor",
  RECEPTIONIST: "Receptionist",
} as const;

/** Roles shown on the scheduler (includes legacy `provider` until DB is normalized). */
export const SCHEDULER_STAFF_ROLES = [
  ClinicDbRole.CHIROPRACTOR,
  "provider",
] as const;
