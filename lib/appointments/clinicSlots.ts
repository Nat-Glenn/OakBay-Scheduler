/**
 * Clinic-wide time slot rules: up to 4 parallel appointments per start time,
 * each with a unique chiropractor and unique patient.
 */

import { prisma } from "@/lib/prisma";
import { findPatientOverlap, findProviderOverlap } from "@/lib/appointments";
import {
  AppointmentStatus,
  type AppointmentStatusValue,
} from "@/lib/appointments/constants";

export const MAX_CLINIC_SLOTS_PER_TIME = 4;

/** Statuses that occupy a scheduler slot at a given start time. */
export const SLOT_BLOCKING_STATUSES: AppointmentStatusValue[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
];

export async function getAppointmentsAtStartTime(
  startTime: Date,
  excludeAppointmentId?: number,
) {
  return prisma.appointment.findMany({
    where: {
      startTime,
      status: { in: SLOT_BLOCKING_STATUSES },
      ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
    },
    select: {
      id: true,
      slot: true,
      patientId: true,
      providerId: true,
    },
    orderBy: { slot: "asc" },
  });
}

export function pickNextClinicSlot(
  existing: Array<{ slot: number }>,
): number | null {
  if (existing.length >= MAX_CLINIC_SLOTS_PER_TIME) {
    return null;
  }
  const used = new Set(existing.map((a) => a.slot));
  return [1, 2, 3, 4].find((s) => !used.has(s)) ?? null;
}

export async function validateClinicSlotBooking(opts: {
  startTime: Date;
  endTime: Date;
  patientId: number;
  providerId: number | null | undefined;
  excludeAppointmentId?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { startTime, endTime, patientId, providerId, excludeAppointmentId } =
    opts;

  if (!providerId) {
    return {
      ok: false,
      error: "Please assign a chiropractor for this appointment.",
    };
  }

  const atTime = await getAppointmentsAtStartTime(startTime, excludeAppointmentId);

  if (atTime.length >= MAX_CLINIC_SLOTS_PER_TIME) {
    return {
      ok: false,
      error: "All 4 time slots are booked for this time.",
    };
  }

  if (atTime.some((a) => a.providerId === providerId)) {
    return {
      ok: false,
      error: "This chiropractor already has an appointment at this time.",
    };
  }

  if (atTime.some((a) => a.patientId === patientId)) {
    return {
      ok: false,
      error: "This patient already has an appointment at this time.",
    };
  }

  const providerConflict = await findProviderOverlap({
    providerId,
    startTime,
    endTime,
    excludeAppointmentId,
  });

  if (providerConflict) {
    return {
      ok: false,
      error: "This chiropractor has another appointment during this time.",
    };
  }

  const patientConflict = await findPatientOverlap({
    patientId,
    startTime,
    endTime,
    excludeAppointmentId,
  });

  if (patientConflict) {
    return {
      ok: false,
      error: "This patient has another appointment during this time.",
    };
  }

  return { ok: true };
}

export async function reserveClinicSlot(opts: {
  startTime: Date;
  endTime: Date;
  patientId: number;
  providerId: number | null | undefined;
  excludeAppointmentId?: number;
}): Promise<
  { ok: true; slot: number } | { ok: false; error: string }
> {
  const validation = await validateClinicSlotBooking(opts);
  if (!validation.ok) {
    return validation;
  }

  const atTime = await getAppointmentsAtStartTime(
    opts.startTime,
    opts.excludeAppointmentId,
  );
  const slot = pickNextClinicSlot(atTime);

  if (!slot) {
    return {
      ok: false,
      error: "All 4 time slots are booked for this time.",
    };
  }

  return { ok: true, slot };
}
