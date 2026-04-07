import { prisma } from "@/lib/prisma";
import { hasProfanity, cleanField } from "@/lib/profanity";
import { encryptField, decryptField } from "@/lib/encrypt";

function decryptPatient<T extends { ahcNumber: string | null }>(patient: T): T {
  return {
    ...patient,
    ahcNumber: decryptField(patient.ahcNumber),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email =
      body.email !== undefined && body.email !== null
        ? String(body.email).trim()
        : null;
    const ahcNumber =
      body.ahcNumber !== undefined && body.ahcNumber !== null
        ? String(body.ahcNumber).trim()
        : null;
    const dob =
      body.dob !== undefined && body.dob !== null
        ? String(body.dob).trim()
        : null;

    // Max year of birth must be at least 1 year ago — patient must be at least 1 year old
    if (dob) {
      const dobDate = new Date(dob);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (dobDate > oneYearAgo) {
        return Response.json(
          { error: "Date of birth must be at least 1 year ago" },
          { status: 400 }
        );
      }
    }

    const notes = cleanField(body.notes);

    // Required fields validation — check these before profanity to give clear errors
    if (!firstName || !lastName || !phone) {
      return Response.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 },
      );
    }

    // Profanity in names is rejected
    if (hasProfanity(firstName)) {
      return Response.json(
        { error: "First name cannot contain inappropriate language" },
        { status: 400 },
      );
    }
    if (hasProfanity(lastName)) {
      return Response.json(
        { error: "Last name cannot contain inappropriate language" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        ahcNumber: ahcNumber ? encryptField(ahcNumber) : null,
        dob: dob || null,
        reminderOptIn: body.reminderOptIn ?? true,
        notes,
      },
    });

    return Response.json(decryptPatient(patient), { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to create patient" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
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
    return Response.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}