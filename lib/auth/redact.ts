/**
 * Field-level redaction for patient data based on the viewer's role.
 */

import { canViewFullAhc } from "@/lib/auth/permissions";
import type { AppRoleValue } from "@/lib/auth/roles";

export function redactPatientForRole<T extends { ahcNumber?: string | null }>(
  patient: T,
  role: AppRoleValue,
): T {
  if (canViewFullAhc(role) || !patient.ahcNumber) {
    return patient;
  }

  return {
    ...patient,
    ahcNumber: "Restricted",
  };
}
