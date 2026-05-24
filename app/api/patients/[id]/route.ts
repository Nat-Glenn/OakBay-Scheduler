import { prisma } from "@/lib/prisma";
import { badRequest, notFound, serverError } from "@/lib/api";
import { encryptField, decryptField } from "@/lib/encrypt";
import { withAuth } from "@/lib/withAuth";
import { patchPatientSchema } from "@/lib/patients/schemas";
import { redactPatientForRole } from "@/lib/auth/redact";

export const GET = withAuth(async (_req, context, user) => {
  try {
    const { id: idStr } = await context.params;
    const patientId = Number(idStr);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return badRequest("Invalid patient id", { id: idStr });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return notFound("Patient not found");

    return Response.json(
      redactPatientForRole(
        {
          ...patient,
          ahcNumber: decryptField(patient.ahcNumber),
        },
        user.role,
      ),
    );
  } catch (err) {
    console.error(err);
    return serverError("Failed to load patient");
  }
});

export const PATCH = withAuth(async (req, context, user) => {
  try {
    const { id } = await context.params;
    const patientId = Number(id);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return badRequest("Invalid patient id");
    }

    const body = await req.json();
    const parsed = parseBody(patchPatientSchema, body);
    if (!parsed.ok) return parsed.response;

    const { firstName, lastName, phone, email, ahcNumber, dob, notes, reminderOptIn } =
      parsed.data;

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
        ...(reminderOptIn !== undefined ? { reminderOptIn } : {}),
      },
    });

    return Response.json(
      redactPatientForRole(
        {
          ...updatedPatient,
          ahcNumber: decryptField(updatedPatient.ahcNumber),
        },
        user.role,
      ),
    );
  } catch (error) {
    console.error("PATCH /api/patients/[id] error:", error);
    return serverError("Failed to update patient");
  }
});
