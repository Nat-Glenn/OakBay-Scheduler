/**
 * Encrypt/decrypt patient fields stored with AES-256-GCM (ahcNumber, notes).
 */

import { decryptField, encryptField } from "@/lib/encrypt";

export type PatientSensitiveFields = {
  ahcNumber?: string | null;
  notes?: string | null;
};

export function decryptPatientSensitiveFields<T extends PatientSensitiveFields>(
  patient: T,
): T {
  return {
    ...patient,
    ahcNumber: decryptField(patient.ahcNumber ?? null),
    notes: decryptField(patient.notes ?? null),
  };
}

export function encryptPatientNotesForStorage(
  notes: string | null | undefined,
): string | null {
  if (!notes) return null;
  return encryptField(notes);
}

export function encryptAhcForStorage(
  ahcNumber: string | null | undefined,
): string | null {
  if (!ahcNumber) return null;
  return encryptField(ahcNumber);
}
