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

export {
  CLINIC_TIME_SLOTS,
  CLINIC_TIME_SLOT_OPTIONS,
  getOfficeTimeSlotsForDate,
  isClinicOpenOnDate,
  isClockWithinOfficeHours,
  OFFICE_HOURS_DISPLAY,
  formatOfficeHoursForDate,
  toFormOptions,
} from "@/lib/clinic/officeHours.js";

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

export const APPOINTMENT_TYPE_OPTIONS = toFormOptions(APPOINTMENT_TYPES);
