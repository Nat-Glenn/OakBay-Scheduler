import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { decryptField } from "@/lib/encrypt";

// GET /api/patients/[id]
// Returns a single patient by ID.
// Called by AddAppointment.js when opening from a patient profile page.
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const patientId = Number(idStr);

    // Validate the ID is a positive integer
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return badRequest("Invalid patient id", { id: idStr });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return notFound("Patient not found");

    // Decrypt ahcNumber before returning to frontend
    return ok({
      ...patient,
      ahcNumber: decryptField(patient.ahcNumber),
    });
  } catch (err) {
    console.error(err);
    return serverError("Failed to load patient");
  }
}