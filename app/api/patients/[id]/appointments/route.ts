import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const patientId = Number(idStr);

    if (!patientId) {
      return Response.json({ error: "Invalid patient id" }, { status: 400 });
    }

    const history = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        payment: true,
        provider: true,
      },
      orderBy: { startTime: "desc" },
    });

    return Response.json(history);
  } catch (err) {
    console.error("GET /api/patients/[id]/appointments error:", err);
    return Response.json(
      { error: "Failed to load patient appointment history" },
      { status: 500 }
    );
  }
}