/**
 * Appointment status and type constants shared by API routes and UI.
 * Status values are backed by the Prisma AppointmentStatus enum.
 */

import { AppointmentStatus as DbAppointmentStatus } from "@prisma/client";

export const AppointmentStatus = DbAppointmentStatus;
export type AppointmentStatusValue = DbAppointmentStatus;

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

/** Clinic schedule time slots — union of all office-hour increments. */
export { CLINIC_TIME_SLOTS } from "@/lib/clinic/officeHours.js";
