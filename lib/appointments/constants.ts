/**
 * Appointment status and type constants shared by API routes and UI.
 * DB stores uppercase statuses; the scheduler UI uses lowercase labels.
 */

export const AppointmentStatus = {
  REQUESTED: "REQUESTED",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatusValue =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const UiAppointmentStatus = {
  SCHEDULED: "scheduled",
  CHECKED_IN: "checked-in",
  CHECKED_OUT: "checked-out",
  CANCELLED: "cancelled",
} as const;

export type UiAppointmentStatusValue =
  (typeof UiAppointmentStatus)[keyof typeof UiAppointmentStatus];

export const ALLOWED_APPOINTMENT_STATUSES: AppointmentStatusValue[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
];

export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatusValue[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
];

export const SCHEDULABLE_APPOINTMENT_STATUSES: AppointmentStatusValue[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
];

export const ALLOWED_APPOINTMENT_TYPES = [
  "Chiropractic Adjustment",
  "Massage",
  "Intense Massage",
  "Initial Consultation",
  "Follow-up",
  "Adjustment",
] as const;

export type AppointmentTypeValue = (typeof ALLOWED_APPOINTMENT_TYPES)[number];

/** Map a DB status to the label used in scheduler components. */
export function dbStatusToUi(
  status: string | null | undefined,
): UiAppointmentStatusValue | string {
  const upper = status?.toUpperCase();

  switch (upper) {
    case AppointmentStatus.REQUESTED:
    case AppointmentStatus.CONFIRMED:
      return UiAppointmentStatus.SCHEDULED;
    case AppointmentStatus.CHECKED_IN:
      return UiAppointmentStatus.CHECKED_IN;
    case AppointmentStatus.COMPLETED:
      return UiAppointmentStatus.CHECKED_OUT;
    case AppointmentStatus.CANCELLED:
      return UiAppointmentStatus.CANCELLED;
    default:
      return status?.toLowerCase() || UiAppointmentStatus.SCHEDULED;
  }
}

/** Clinic schedule time slots (15-minute increments). */
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
] as const;
