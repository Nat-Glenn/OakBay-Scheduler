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
      select: { id: true, status: true },
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

    let slot: number | undefined;

    if (providerId !== undefined && startTime !== undefined) {
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          providerId,
          startTime,
          NOT: { id },
        },
        orderBy: { slot: "asc" },
        select: { slot: true },
      });

      if (existingAppointments.length >= 4) {
        return badRequest("All 4 slots for this time have been booked.");
      }

      const usedSlots = existingAppointments.map((appt) => appt.slot);
      slot = [1, 2, 3, 4].find((s) => !usedSlots.includes(s)) ?? 1;
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
