import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const patientId = Number(idStr);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return badRequest("Invalid patient id", { id: idStr });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) return notFound("Patient not found");

    const history = await prisma.appointment.findMany({
      where: { patientId },
      include: { payment: true, provider: true },
      orderBy: { startTime: "desc" },
    });

    return ok(history);
  } catch (err) {
    console.error(err);
    return serverError("Failed to load appointment history");
  }
}