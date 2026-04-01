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
    return Response.json({
  ...patient,
  ahcNumber: decryptField(patient.ahcNumber),
});
  } catch (err) {
    console.error(err);
    return serverError("Failed to load patient");
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patientId = Number(id);

    if (!patientId || Number.isNaN(patientId)) {
      return Response.json({ error: "Invalid patient id" }, { status: 400 });
    }

    const body = await req.json();

    const firstName =
      body.firstName !== undefined ? String(body.firstName).trim() : undefined;
    const lastName =
      body.lastName !== undefined ? String(body.lastName).trim() : undefined;
    const phone =
      body.phone !== undefined ? String(body.phone).trim() : undefined;
    const email =
      body.email !== undefined && body.email !== null
        ? String(body.email).trim()
        : body.email === null
          ? null
          : undefined;
    const ahcNumber =
      body.ahcNumber !== undefined && body.ahcNumber !== null
        ? String(body.ahcNumber).trim()
        : body.ahcNumber === null
          ? null
          : undefined;
    const dob =
      body.dob !== undefined && body.dob !== null
        ? String(body.dob).trim()
        : body.dob === null
          ? null
          : undefined;
    const notes =
      body.notes !== undefined && body.notes !== null
        ? String(body.notes).trim()
        : body.notes === null
          ? null
          : undefined;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(ahcNumber !== undefined
          ? { ahcNumber: ahcNumber ? encryptField(ahcNumber) : null }
          : {}),
        ...(dob !== undefined ? { dob: dob || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(body.reminderOptIn !== undefined
          ? { reminderOptIn: Boolean(body.reminderOptIn) }
          : {}),
      },
    });

    return Response.json(updatedPatient);
  } catch (error) {
    console.error("PATCH /api/patients/[id] error:", error);
    return Response.json({ error: "Failed to update patient" }, { status: 500 });
  }
}