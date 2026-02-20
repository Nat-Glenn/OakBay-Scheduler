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
