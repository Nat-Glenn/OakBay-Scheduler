/**
 * Appointment status sync and allowed transitions.
 * No-show (never checked in) → CANCELLED. COMPLETED only after CHECKED_IN + checkout.
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

/** Whether a status change is allowed by clinic workflow rules. */
export function isValidStatusTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from === to) return true;

  switch (to) {
    case AppointmentStatus.CHECKED_IN:
      return (
        from === AppointmentStatus.REQUESTED ||
        from === AppointmentStatus.CONFIRMED
      );
    case AppointmentStatus.COMPLETED:
      return from === AppointmentStatus.CHECKED_IN;
    case AppointmentStatus.CANCELLED:
      return (
        from === AppointmentStatus.REQUESTED ||
        from === AppointmentStatus.CONFIRMED ||
        from === AppointmentStatus.CHECKED_IN
      );
    default:
      return false;
  }
}

/**
 * Normalizes overdue appointments before reads:
 * - Never checked in (REQUESTED/CONFIRMED) → CANCELLED
 * - COMPLETED without a payment record → CANCELLED (invalid completion)
 */
export async function syncOverdueAppointmentStatuses() {
  const now = new Date();

  await prisma.appointment.updateMany({
    where: {
      status: { in: [...SCHEDULABLE_APPOINTMENT_STATUSES] },
      endTime: { lt: now },
    },
    data: { status: AppointmentStatus.CANCELLED },
  });

  await prisma.appointment.updateMany({
    where: {
      status: AppointmentStatus.COMPLETED,
      endTime: { lt: now },
      payment: null,
    },
    data: { status: AppointmentStatus.CANCELLED },
  });
}
