import { prisma } from "@/lib/prisma";

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

    // Optional fields
    const providerId = body.providerId ? Number(body.providerId) : null;
    const createdByUserId = body.createdByUserId ? Number(body.createdByUserId) : null;
    const requestMessage = body.requestMessage ? String(body.requestMessage) : null;
    const adminNotes = body.adminNotes ? String(body.adminNotes) : null;

    // Basic overlap check for the same provider (if providerId is assigned)
    if (providerId) {
      const overlap = await prisma.appointment.findFirst({
        where: {
          providerId,
          AND: [
            { startTime: { lt: endTime } }, // existing starts before new ends
            { endTime: { gt: startTime } }, // existing ends after new starts
          ],
        },
      });

      if (overlap) {
        return Response.json(
          { error: "Time conflict: provider already has an appointment in that time range." },
          { status: 409 }
        );
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        type,
        status: "requested", // default
        startTime,
        endTime,
        providerId,
        createdByUserId,
        requestMessage,
        adminNotes,
      },
      include: {
        patient: true,
        provider: true,
        payment: true,
      },
    });

    return Response.json(appointment, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}