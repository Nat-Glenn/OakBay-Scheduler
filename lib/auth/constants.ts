/**
 * Canonical clinic staff roles stored on User.role in the database (Prisma enum).
 */

import { ClinicRole } from "@prisma/client";

export const ClinicDbRole = ClinicRole;

/** Roles listed as bookable practitioners on the scheduler. */
export const SCHEDULER_STAFF_ROLES = [ClinicRole.Chiropractor] as const;
