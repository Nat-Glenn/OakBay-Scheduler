import { prisma } from "@/lib/prisma";
import { cleanField, hasUnsafeLanguage } from "@/lib/profanity"; //safety + profanity tools
import { sendBookingConfirmationEmail } from "@/lib/email";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // expected: YYYY-MM-DD

    if (!dateStr) {
      return Response.json(
        { error: "Missing ?date=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) {
      return Response.json({ error: "Invalid date format" }, { status: 400 });
    }

    const from = startOfDay(d);
    const to = endOfDay(d);

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: from, lte: to },
      },
      include: {
        patient: true,

        // Prevent exposing password, only the needed info is returned
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        payment: true,
      },
      orderBy: { startTime: "asc" },
    });

    return Response.json(appointments);
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Required fields
    const patientId = Number(body.patientId);
    const type = String(body.type ?? "").trim();
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (!patientId || !type || !isValidDate(startTime) || !isValidDate(endTime)) {
      return Response.json(
        { error: "Missing or invalid fields (patientId, type, startTime, endTime)" },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return Response.json({ error: "endTime must be after startTime" }, { status: 400 });
    }

    // TC-073: Validate appointment type against allowed list — rejects invalid types
    const allowedTypes = [
      "Chiropractic Adjustment",
      "Massage",
      "Intense Massage",
      "Initial Consultation",
      "Follow-up",
      "Adjustment",
    ];
    if (!allowedTypes.includes(type)) {
      return Response.json(
        { error: "Invalid appointment type", accepted: allowedTypes },
        { status: 400 }
      );
    }

    // Optional fields
    const providerId = body.providerId ? Number(body.providerId) : null;
    const createdByUserId = body.createdByUserId ? Number(body.createdByUserId) : null;

    // Clean user input text instead of rejecting.
    const requestMessage = cleanField(body.requestMessage);
    const adminNotes = cleanField(body.adminNotes);

    // Blocks unsafe or harmful language BEFORE saving to database
    if (
      hasUnsafeLanguage(body.requestMessage) ||
      hasUnsafeLanguage(body.adminNotes)
    ) {
      return Response.json(
        { error: "Unsafe or threatening language is not allowed" },
        { status: 400 }
      );
    }

    // TC-062/063: Max length validation on notes fields — prevents silent data overflow
    if (requestMessage && requestMessage.length > 500) {
      return Response.json(
        { error: "Request message cannot exceed 500 characters" },
        { status: 400 }
      );
    }
    if (adminNotes && adminNotes.length > 500) {
      return Response.json(
        { error: "Admin notes cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    let slot = 1;

    if (providerId) {
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          providerId,
          startTime,
        },
        orderBy: {
          slot: "asc",
        },
        select: {
          slot: true,
        },
      });

      if (existingAppointments.length >= 4) {
        return Response.json(
          { error: "All 4 slots for this time have been booked." },
          { status: 409 }
        );
      }

      const usedSlots = existingAppointments.map((appt) => appt.slot);
      const allSlots = [1, 2, 3, 4];
      slot = allSlots.find((s) => !usedSlots.includes(s)) || 1;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return Response.json({ error: "Patient not found" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        type,
        status: "REQUESTED", // default
        startTime,
        endTime,
        slot,
        providerId,
        createdByUserId,
        requestMessage,
        adminNotes,
      },
      include: {
        patient: true,

        // Return safe provider info only (no password)
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        payment: true,
      },
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
}