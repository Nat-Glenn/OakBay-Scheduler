/**
 * Staff actions on appointment requests: approve (schedule) or decline.
 */

import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/appointments/constants";
import { reserveClinicSlot } from "@/lib/appointments/clinicSlots";
import { cleanField } from "@/lib/profanity";
import {
  sendBookingConfirmationEmail,
  sendRequestDeclinedEmail,
} from "@/lib/email";
import { AppointmentRequestStatus } from "@prisma/client";
import type { BookingPatientKind } from "@prisma/client";
import { BOOKING_PATIENT_KIND } from "@/lib/booking-requests/constants";

const requestInclude = {
  preferences: { orderBy: { sortOrder: "asc" as const } },
  patient: true,
  appointment: true,
};

/** Looks up an existing patient by email for returning-patient bookings. */
export async function findPatientByEmailForReturning(email: string) {
  const normalized = email.trim().toLowerCase();
  return prisma.patient.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
  });
}

/**
 * Links an approved request to a patient record.
 * Returning: existing record only (names stay as on file).
 * New: create patient or match by phone; apply submitted name.
 */
export async function resolvePatientForBookingRequest(
  request: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  },
  patientKind: BookingPatientKind,
) {
  const email = request.email.trim().toLowerCase();
  const firstName = request.firstName.trim();
  const lastName = request.lastName.trim();
  const phone = request.phone;

  if (patientKind === BOOKING_PATIENT_KIND.RETURNING) {
    const existing = await findPatientByEmailForReturning(email);
    if (!existing) {
      throw new Error("Returning patient record not found for this email");
    }
    return existing;
  }

  const byEmail = await findPatientByEmailForReturning(email);
  if (byEmail) {
    return prisma.patient.update({
      where: { id: byEmail.id },
      data: { firstName, lastName, phone },
    });
  }

  const byPhone = await prisma.patient.findFirst({
    where: { phone },
  });
  if (byPhone) {
    return prisma.patient.update({
      where: { id: byPhone.id },
      data: {
        firstName,
        lastName,
        ...(!byPhone.email ? { email } : {}),
      },
    });
  }

  return prisma.patient.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      reminderOptIn: true,
    },
  });
}

/** Blocks duplicate queue spam while a prior request is still pending. */
export async function hasPendingBookingRequestForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const count = await prisma.appointmentRequest.count({
    where: {
      email: normalized,
      status: AppointmentRequestStatus.PENDING,
    },
  });
  return count > 0;
}

export async function approveBookingRequest(opts: {
  requestId: number;
  preferenceId: number;
  providerId: number;
  status?: "CONFIRMED" | "REQUESTED";
  adminNotes?: string | null;
  reviewedByUserId: number;
}) {
  const {
    requestId,
    preferenceId,
    providerId,
    status = "CONFIRMED",
    adminNotes,
    reviewedByUserId,
  } = opts;

  const existing = await prisma.appointmentRequest.findUnique({
    where: { id: requestId },
    include: requestInclude,
  });

  if (!existing) {
    return { ok: false as const, error: "Request not found", status: 404 };
  }

  if (existing.status !== AppointmentRequestStatus.PENDING) {
    return {
      ok: false as const,
      error: "This request has already been reviewed",
      status: 409,
    };
  }

  const preference = existing.preferences.find((p) => p.id === preferenceId);
  if (!preference) {
    return {
      ok: false as const,
      error: "Preferred time not found on this request",
      status: 400,
    };
  }

  const patient = await resolvePatientForBookingRequest(
    existing,
    existing.patientKind,
  );

  const slotReservation = await reserveClinicSlot({
    startTime: preference.startTime,
    endTime: preference.endTime,
    patientId: patient.id,
    providerId,
  });

  if (!slotReservation.ok) {
    return { ok: false as const, error: slotReservation.error, status: 409 };
  }

  const notes = cleanField(
    [existing.message, adminNotes].filter(Boolean).join("\n\n"),
  );

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      type: existing.type,
      status:
        status === "CONFIRMED"
          ? AppointmentStatus.CONFIRMED
          : AppointmentStatus.REQUESTED,
      startTime: preference.startTime,
      endTime: preference.endTime,
      slot: slotReservation.slot,
      providerId,
      createdByUserId: reviewedByUserId,
      requestMessage: existing.message,
      adminNotes: notes || null,
    },
    include: { patient: true, provider: true },
  });

  const updatedRequest = await prisma.appointmentRequest.update({
    where: { id: requestId },
    data: {
      status: AppointmentRequestStatus.SCHEDULED,
      patientId: patient.id,
      appointmentId: appointment.id,
      reviewedByUserId,
      reviewedAt: new Date(),
    },
    include: requestInclude,
  });

  if (patient.email) {
    sendBookingConfirmationEmail({
      to: patient.email,
      patientName: `${patient.firstName} ${patient.lastName}`,
      appointmentType: appointment.type,
      startTime: appointment.startTime,
    }).catch((err) => console.error("Confirmation email failed:", err));
  }

  return { ok: true as const, request: updatedRequest, appointment };
}

export async function declineBookingRequest(opts: {
  requestId: number;
  declineReason?: string | null;
  reviewedByUserId: number;
}) {
  const { requestId, declineReason, reviewedByUserId } = opts;

  const existing = await prisma.appointmentRequest.findUnique({
    where: { id: requestId },
  });

  if (!existing) {
    return { ok: false as const, error: "Request not found", status: 404 };
  }

  if (existing.status !== AppointmentRequestStatus.PENDING) {
    return {
      ok: false as const,
      error: "This request has already been reviewed",
      status: 409,
    };
  }

  const updated = await prisma.appointmentRequest.update({
    where: { id: requestId },
    data: {
      status: AppointmentRequestStatus.DECLINED,
      declineReason: cleanField(declineReason ?? "") || null,
      reviewedByUserId,
      reviewedAt: new Date(),
    },
    include: requestInclude,
  });

  sendRequestDeclinedEmail({
    to: existing.email,
    patientName: `${existing.firstName} ${existing.lastName}`,
    declineReason: updated.declineReason,
  }).catch((err) => console.error("Decline email failed:", err));

  return { ok: true as const, request: updated };
}

export { requestInclude };
