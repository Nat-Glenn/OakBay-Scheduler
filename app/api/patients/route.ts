import { prisma } from "@/lib/prisma";
import { hasProfanity, cleanField } from "@/lib/profanity";
import { withAuthSimple } from "@/lib/withAuth";
import { badRequest, serverError } from "@/lib/api";
import { createPatientSchema } from "@/lib/patients/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import { redactPatientForRole } from "@/lib/auth/redact";
import { AppointmentStatus } from "@/lib/appointments/constants";
import {
  decryptPatientSensitiveFields,
  encryptAhcForStorage,
  encryptPatientNotesForStorage,
} from "@/lib/patients/sensitiveFields";
import { AuditAction } from "@/lib/audit/constants";
import { logAuditEvent } from "@/lib/audit/log";

export const POST = withAuthSimple(async (req, user) => {
  try {
    const body = await req.json();
    const parsed = parseBody(createPatientSchema, body);
    if (!parsed.ok) return parsed.response;

    const {
      firstName,
      lastName,
      phone,
      email,
      ahcNumber,
      dob,
      reminderOptIn,
    } = parsed.data;

    const notes = cleanField(body.notes);

    if (hasProfanity(firstName)) {
      return badRequest("First name cannot contain inappropriate language");
    }
    if (hasProfanity(lastName)) {
      return badRequest("Last name cannot contain inappropriate language");
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        ahcNumber: encryptAhcForStorage(ahcNumber),
        dob: dob || null,
        reminderOptIn,
        notes: encryptPatientNotesForStorage(notes),
      },
    });

    await logAuditEvent({
      req,
      user,
      action: AuditAction.PATIENT_CREATE,
      patientId: patient.id,
      resourceId: `patient:${patient.id}`,
    });

    return Response.json(
      redactPatientForRole(decryptPatientSensitiveFields(patient), user.role),
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return serverError("Failed to create patient");
  }
});

export const GET = withAuthSimple(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") ?? "").trim();

    const numericSearch = Number(search);

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              ...(!Number.isNaN(numericSearch) ? [{ id: numericSearch }] : []),
            ],
          }
        : undefined,
      orderBy: [{ id: "asc" }],
      take: 25,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        dob: true,
        reminderOptIn: true,
        appointments: {
          where: {
            status: AppointmentStatus.COMPLETED,
            payment: { isNot: null },
          },
          orderBy: { startTime: "desc" },
          take: 1,
          select: { startTime: true },
        },
      },
    });

    return Response.json(
      patients.map((patient) => {
        const { appointments, ...rest } = patient;
        return {
          ...rest,
          lastVisit:
            appointments.length > 0 ? appointments[0].startTime : null,
        };
      }),
    );
  } catch (err) {
    console.error(err);
    return serverError("Failed to fetch patients");
  }
});
