import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { cleanField } from "@/lib/profanity";
import { sendCancellationEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("Invalid appointment id", { id: idStr });
    }

    const body = await req.json();

    const status = body.status
      ? String(body.status).trim().toUpperCase()
      : undefined;

    const adminNotes =
      body.adminNotes !== undefined
        ? cleanField(String(body.adminNotes))
        : undefined;

    const type =
      body.type !== undefined ? String(body.type).trim() : undefined;

    const providerId =
      body.providerId !== undefined && body.providerId !== null
        ? Number(body.providerId)
        : undefined;

    const startTime =
      body.startTime !== undefined && body.startTime !== null
        ? new Date(body.startTime)
        : undefined;

    const endTime =
      body.endTime !== undefined && body.endTime !== null
        ? new Date(body.endTime)
        : undefined;

    const allowedStatuses = [
      "REQUESTED",
      "CONFIRMED",
      "CHECKED_IN",
      "COMPLETED",
      "CANCELLED",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return badRequest("Invalid status value", { allowedStatuses });
    }

    if (providerId !== undefined && (!Number.isInteger(providerId) || providerId <= 0)) {
      return badRequest("Invalid providerId", { providerId });
    }

    if (startTime !== undefined && Number.isNaN(startTime.getTime())) {
      return badRequest("Invalid startTime");
    }

    if (endTime !== undefined && Number.isNaN(endTime.getTime())) {
      return badRequest("Invalid endTime");
    }

    if (startTime && endTime && endTime <= startTime) {
      return badRequest("endTime must be after startTime");
    }

    const exists = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) return notFound("Appointment not found");

    let slot: number | undefined = undefined;

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
      const allSlots = [1, 2, 3, 4];
      slot = allSlots.find((s) => !usedSlots.includes(s));
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(slot !== undefined ? { slot } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(providerId !== undefined ? { providerId } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
      },
      include: { patient: true, provider: true, payment: true },
    });

    // Send cancellation email if appointment was cancelled
    
    if (status === "CANCELLED" && updated.patient?.email) {
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
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // Only send cancellation email if appointment was active — not if already
    // COMPLETED or CANCELLED (patient already knows)
    const activeStatuses = ["REQUESTED", "CONFIRMED", "CHECKED_IN"];
    if (
      activeStatuses.includes(appointment.status) &&
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

    // Delete payment first — FK constraint requires this before appointment delete
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
}