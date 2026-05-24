/**
 * Appointment status sync and date-range helpers for API queries.
 */

import { prisma } from "@/lib/prisma";
import {
  AppointmentStatus,
  SCHEDULABLE_APPOINTMENT_STATUSES,
} from "@/lib/appointments/constants";

import {
  getClinicDayBounds,
  parseClinicDateParam,
} from "@/lib/appointments/clinicTime";

/** @deprecated Use parseClinicDateParam */
export function parseAppointmentDateParam(value: string | null) {
  const parts = parseClinicDateParam(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day);
}

/** @deprecated Use getClinicDayBounds */
export function getLocalDayBounds(date: Date) {
  return getClinicDayBounds({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

/** Auto-complete and auto-cancel overdue appointments before reads. */
export async function syncOverdueAppointmentStatuses() {
  const now = new Date();

  await prisma.appointment.updateMany({
    where: {
      status: AppointmentStatus.CHECKED_IN,
      endTime: { lt: now },
    },
    data: { status: AppointmentStatus.COMPLETED },
  });

  await prisma.appointment.updateMany({
    where: {
      status: { in: [...SCHEDULABLE_APPOINTMENT_STATUSES] },
      endTime: { lt: now },
    },
    data: { status: AppointmentStatus.CANCELLED },
  });
}
