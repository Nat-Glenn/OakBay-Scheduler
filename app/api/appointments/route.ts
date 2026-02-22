import { prisma } from "@/lib/prisma";
import { created, badRequest, conflict, notFound, serverError } from "@/lib/api";
import { parseIntStrict, parseNonEmptyString, parseDate } from "@/lib/validate";
import { findPatientOverlap, findProviderOverlap } from "@/lib/appointments";

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
        provider: true,
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


//Create Appointment API (POST)

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const patientId = parseIntStrict(body.patientId);
    const type = parseNonEmptyString(body.type);
    const startTime = parseDate(body.startTime);
    const endTime = parseDate(body.endTime);

    if (!patientId || !type || !startTime || !endTime) {
      return badRequest("Missing or invalid fields", {
        required: ["patientId", "type", "startTime", "endTime"],
      });
    }

    if (endTime <= startTime) {
      return badRequest("endTime must be after startTime");
    }

    // Ensure patient exists (prevents FK 500s)
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) return notFound("Patient not found");

    const providerId = body.providerId ? parseIntStrict(body.providerId) : null;

    if (providerId) {
      const overlap = await findProviderOverlap({ providerId, startTime, endTime });
      if (overlap) {
        return conflict("Time conflict for provider", { overlap });
      }
    }

    // Prevent patient double-booking (even if providerId is null)
const patientOverlap = await findPatientOverlap({ patientId, startTime, endTime });
if (patientOverlap) {
  return conflict(
    "Time conflict: patient already has an appointment in that time range",
    { overlap: patientOverlap }
  );
}

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        type,
        status: "requested",
        startTime,
        endTime,
        providerId,
        createdByUserId: body.createdByUserId ? parseIntStrict(body.createdByUserId) : null,
        requestMessage: body.requestMessage ? String(body.requestMessage) : null,
        adminNotes: body.adminNotes ? String(body.adminNotes) : null,
      },
      include: { patient: true, provider: true, payment: true },
    });

    return created(appointment);
  } catch (err) {
    console.error(err);
    return serverError("Failed to create appointment");
  }
}