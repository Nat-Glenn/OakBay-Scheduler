import { prisma } from "@/lib/prisma";
import { cleanField, hasUnsafeLanguage } from "@/lib/profanity";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { withAuthSimple } from "@/lib/withAuth";
import { AppointmentStatus } from "@/lib/appointments/constants";
import { createAppointmentSchema } from "@/lib/appointments/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import {
  getClinicDayBounds,
  parseClinicDateParam,
} from "@/lib/appointments/clinicTime";
import { syncOverdueAppointmentStatuses } from "@/lib/appointments/lifecycle";

const appointmentInclude = {
  patient: true,
  provider: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  payment: true,
};

export const GET = withAuthSimple(async (req) => {
  try {
    await syncOverdueAppointmentStatuses();

    const { searchParams } = new URL(req.url);
    const dayParts = parseClinicDateParam(searchParams.get("date"));

    const where = dayParts
      ? {
          startTime: {
            gte: getClinicDayBounds(dayParts).start,
            lte: getClinicDayBounds(dayParts).end,
          },
        }
      : undefined;

    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ startTime: "asc" }, { slot: "asc" }],
    });

    return Response.json(appointments);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
});

export const POST = withAuthSimple(async (req) => {
  try {
    const body = await req.json();
    const parsed = parseBody(createAppointmentSchema, body);

    if (!parsed.ok) return parsed.response;

    const {
      patientId,
      type,
      startTime,
      endTime,
      providerId = null,
      createdByUserId = null,
    } = parsed.data;

    const now = new Date();

    if (startTime <= now) {
      return Response.json(
        { error: "Cannot create an appointment for a time that has already passed." },
        { status: 400 },
      );
    }

    const requestMessage = cleanField(body.requestMessage);
    const adminNotes = cleanField(body.adminNotes);

    if (
      hasUnsafeLanguage(body.requestMessage) ||
      hasUnsafeLanguage(body.adminNotes)
    ) {
      return Response.json(
        { error: "Unsafe or threatening language is not allowed" },
        { status: 400 },
      );
    }

    if (requestMessage && requestMessage.length > 500) {
      return Response.json(
        { error: "Request message cannot exceed 500 characters" },
        { status: 400 },
      );
    }
    if (adminNotes && adminNotes.length > 500) {
      return Response.json(
        { error: "Admin notes cannot exceed 500 characters" },
        { status: 400 },
      );
    }

    let slot = 1;

    if (providerId) {
      const existingAppointments = await prisma.appointment.findMany({
        where: { providerId, startTime },
        orderBy: { slot: "asc" },
        select: { slot: true },
      });

      if (existingAppointments.length >= 4) {
        return Response.json(
          { error: "All 4 slots for this time have been booked." },
          { status: 409 },
        );
      }

      const usedSlots = existingAppointments.map((appt) => appt.slot);
      slot = [1, 2, 3, 4].find((s) => !usedSlots.includes(s)) || 1;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return Response.json({ error: "Patient not found" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        type,
        status: AppointmentStatus.REQUESTED,
        startTime,
        endTime,
        slot,
        providerId,
        createdByUserId,
        requestMessage,
        adminNotes,
      },
      include: appointmentInclude,
    });

    if (appointment.patient?.email) {
      sendBookingConfirmationEmail({
        to: appointment.patient.email,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        appointmentType: appointment.type,
        startTime: appointment.startTime,
      }).catch((error) => {
        console.error("Failed to send booking confirmation email:", error);
      });
    }

    return Response.json(appointment, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to create appointment" }, { status: 500 });
  }
});
