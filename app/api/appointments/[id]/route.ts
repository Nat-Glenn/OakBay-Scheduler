/**
 * PATCH/DELETE single appointment — validated updates and cancellation emails.
 */

import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { cleanField } from "@/lib/profanity";
import { sendCancellationEmail } from "@/lib/email";
import { withAuth } from "@/lib/withAuth";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  AppointmentStatus,
} from "@/lib/appointments/constants";
import { isValidStatusTransition } from "@/lib/appointments/lifecycle";
import { patchAppointmentSchema } from "@/lib/appointments/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import { reserveClinicSlot } from "@/lib/appointments/clinicSlots";

export const PATCH = withAuth(async (req, context) => {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("Invalid appointment id", { id: idStr });
    }

    const body = await req.json();
    const parsed = parseBody(patchAppointmentSchema, body);
    if (!parsed.ok) return parsed.response;

    const {
      status,
      type,
      providerId,
      startTime,
      endTime,
      adminNotes: rawAdminNotes,
    } = parsed.data;

    const adminNotes =
      rawAdminNotes !== undefined ? cleanField(String(rawAdminNotes)) : undefined;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        patientId: true,
        providerId: true,
        startTime: true,
        endTime: true,
        slot: true,
      },
    });

    if (!existing) return notFound("Appointment not found");

    if (
      status !== undefined &&
      !isValidStatusTransition(existing.status, status)
    ) {
      return badRequest("Invalid status transition", {
        from: existing.status,
        to: status,
      });
    }

    const nextStartTime = startTime ?? existing.startTime;
    const nextEndTime = endTime ?? existing.endTime;
    const nextProviderId =
      providerId !== undefined ? providerId : existing.providerId;

    const scheduleChanged =
      (startTime !== undefined &&
        startTime.getTime() !== existing.startTime.getTime()) ||
      (endTime !== undefined &&
        endTime.getTime() !== existing.endTime.getTime()) ||
      (providerId !== undefined && providerId !== existing.providerId);

    let slot: number | undefined;

    if (scheduleChanged) {
      const slotReservation = await reserveClinicSlot({
        startTime: nextStartTime,
        endTime: nextEndTime,
        patientId: existing.patientId,
        providerId: nextProviderId,
        excludeAppointmentId: id,
      });

      if (!slotReservation.ok) {
        return badRequest(slotReservation.error);
      }

      slot = slotReservation.slot;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(slot !== undefined ? { slot } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(providerId !== undefined ? { providerId } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
      },
      include: { patient: true, provider: true, payment: true },
    });

    if (status === AppointmentStatus.CANCELLED && updated.patient?.email) {
      await sendCancellationEmail({
        to: updated.patient.email,
        patientName: `${updated.patient.firstName} ${updated.patient.lastName}`,
        appointmentType: updated.type,
        startTime: updated.startTime,
      });
    }

    return ok(updated);
  } catch (err) {
    console.error(err);
    return serverError("Failed to update appointment");
  }
});

export const DELETE = withAuth(async (req, context) => {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("Invalid appointment id", { id: idStr });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!appointment) return notFound("Appointment not found");

    if (
      ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status) &&
      appointment.patient?.email
    ) {
      sendCancellationEmail({
        to: appointment.patient.email,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        appointmentType: appointment.type,
        startTime: appointment.startTime,
      }).catch((error) => {
        console.error("Failed to send cancellation email:", error);
      });
    }

    await prisma.payment.deleteMany({
      where: { appointmentId: id },
    });

    await prisma.appointment.delete({
      where: { id },
    });

    return ok({ message: "Appointment deleted", id });
  } catch (err) {
    console.error(err);
    return serverError("Failed to delete appointment");
  }
});
