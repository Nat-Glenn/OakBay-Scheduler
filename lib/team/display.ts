/**
 * Human-readable labels for clinic User.role values on the Team page.
 */

import { ClinicRole } from "@prisma/client";

export function clinicRoleLabel(role: string | null | undefined): string {
  if (role === ClinicRole.Chiropractor) return "Chiropractor";
  if (role === ClinicRole.Receptionist) return "Receptionist";
  return role ? String(role) : "—";
}

export const TEAM_ROLE_OPTIONS = [
  { value: ClinicRole.Chiropractor, label: "Chiropractor" },
  { value: ClinicRole.Receptionist, label: "Receptionist" },
] as const;
