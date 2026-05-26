import { prisma } from "@/lib/prisma";
import { badRequest, notFound, serverError } from "@/lib/api";
import { withAuth } from "@/lib/withAuth";
import { patchPatientSchema } from "@/lib/patients/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import { redactPatientForRole } from "@/lib/auth/redact";
import {
  decryptPatientSensitiveFields,
  encryptAhcForStorage,
  encryptPatientNotesForStorage,
} from "@/lib/patients/sensitiveFields";
import { AuditAction } from "@/lib/audit/constants";
import { logAuditEvent } from "@/lib/audit/log";

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

    await logAuditEvent({
      req: _req,
      user,
      action: AuditAction.PATIENT_VIEW,
      patientId: patient.id,
      resourceId: `patient:${patient.id}`,
    });

    return Response.json(
      redactPatientForRole(decryptPatientSensitiveFields(patient), user.role),
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
          ? { ahcNumber: encryptAhcForStorage(ahcNumber) }
          : {}),
        ...(dob !== undefined ? { dob: dob || null } : {}),
        ...(notes !== undefined
          ? { notes: encryptPatientNotesForStorage(notes) }
          : {}),
        ...(reminderOptIn !== undefined ? { reminderOptIn } : {}),
      },
    });

    await logAuditEvent({
      req,
      user,
      action: AuditAction.PATIENT_UPDATE,
      patientId: updatedPatient.id,
      resourceId: `patient:${updatedPatient.id}`,
    });

    return Response.json(
      redactPatientForRole(
        decryptPatientSensitiveFields(updatedPatient),
        user.role,
      ),
    );
  } catch (error) {
    console.error("PATCH /api/patients/[id] error:", error);
    return serverError("Failed to update patient");
  }
});
