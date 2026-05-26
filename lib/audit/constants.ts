/**
 * Audit log action names for PHI and financial record access.
 */

export const AuditAction = {
  PATIENT_VIEW: "patient.view",
  PATIENT_CREATE: "patient.create",
  PATIENT_UPDATE: "patient.update",
  PAYMENT_CREATE: "payment.create",
  CARD_LIST: "card.list",
  CARD_CREATE: "card.create",
  CARD_UPDATE: "card.update",
  CARD_DELETE: "card.delete",
} as const;

export type AuditActionValue =
  (typeof AuditAction)[keyof typeof AuditAction];
