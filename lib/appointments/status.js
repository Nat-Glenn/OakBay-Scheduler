/**
 * Client-safe appointment status helpers (mirrors lib/appointments/constants.ts).
 */

export function dbStatusToUi(status) {
  const upper = status?.toUpperCase();

  switch (upper) {
    case "REQUESTED":
    case "CONFIRMED":
      return "scheduled";
    case "CHECKED_IN":
      return "checked-in";
    case "COMPLETED":
      return "checked-out";
    case "CANCELLED":
      return "cancelled";
    default:
      return status?.toLowerCase() || "scheduled";
  }
}

export const ALL_STAFF = "All staff";

export const CLINIC_TIME_SLOTS = [
  "9:00",
  "9:15",
  "9:30",
  "9:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
  "16:15",
  "16:30",
  "16:45",
  "17:00",
  "17:15",
  "17:30",
  "17:45",
];

export const APPOINTMENT_TYPES = [
  "Chiropractic Adjustment",
  "Massage",
  "Intense Massage",
  "Initial Consultation",
  "Follow-up",
  "Adjustment",
];

/** Combobox items: { id, name } from string lists. */
export function toFormOptions(items) {
  return items.map((name, index) => ({ id: index + 1, name }));
}

export const CLINIC_TIME_SLOT_OPTIONS = toFormOptions(CLINIC_TIME_SLOTS);
export const APPOINTMENT_TYPE_OPTIONS = toFormOptions(APPOINTMENT_TYPES);
