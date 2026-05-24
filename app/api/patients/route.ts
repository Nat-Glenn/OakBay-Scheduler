import { prisma } from "@/lib/prisma";
import { hasProfanity, cleanField } from "@/lib/profanity";
import { encryptField, decryptField } from "@/lib/encrypt";
import { withAuthSimple } from "@/lib/withAuth";
import { badRequest, serverError } from "@/lib/api";
import { createPatientSchema } from "@/lib/patients/schemas";
import { parseBody } from "@/lib/validation/parseBody";

function decryptPatient<T extends { ahcNumber: string | null }>(patient: T): T {
  return {
    ...patient,
    ahcNumber: decryptField(patient.ahcNumber),
  };
}

export const POST = withAuthSimple(async (req) => {
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
        ahcNumber: ahcNumber ? encryptField(ahcNumber) : null,
        dob: dob || null,
        reminderOptIn,
        notes,
      },
    });

    return Response.json(decryptPatient(patient), { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError("Failed to create patient");
  }
});

export const GET = withAuthSimple(async (req) => {
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
      include: {
        appointments: {
          where: {
            status: "COMPLETED",
          },
          orderBy: {
            startTime: "desc",
          },
          take: 1,
          select: {
            startTime: true,
          },
        },
      },
    });

    return Response.json(
      patients.map((patient) => {
        const decryptedPatient = decryptPatient(patient);
        return {
          ...decryptedPatient,
          lastVisit:
            patient.appointments.length > 0
              ? patient.appointments[0].startTime
              : null,
        };
      }),
    );
  } catch (err) {
    console.error(err);
    return serverError("Failed to fetch patients");
  }
});
