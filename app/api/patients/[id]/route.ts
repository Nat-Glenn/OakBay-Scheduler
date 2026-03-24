import { prisma } from "@/lib/prisma";
import { encryptField, decryptField } from "@/lib/encrypt";
import { cleanField, hasProfanity } from "@/lib/profanity";

// ahcNumber (Alberta Health Care number) is encrypted at rest using AES-256-GCM.
// phone and email are stored in plaintext to support search — see COMPLIANCE.md
// for the tradeoff rationale and recommended future improvements.

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
    const notes =
      body.notes !== undefined && body.notes !== null
        ? String(body.notes).trim()
        : null;

    if (!firstName || !lastName || !phone) {
      return Response.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    // Reject profane patient names — names are displayed throughout the UI
    if (hasProfanity(firstName) || hasProfanity(lastName)) {
      return Response.json(
        { error: "Patient name contains inappropriate language" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        // Encrypt AHC number before storing — government health identifier (HIA requirement)
        ahcNumber:encryptField(ahcNumber),
        reminderOptIn: body.reminderOptIn ?? true,
        // Clean notes — replace profanity rather than rejecting the record
        notes: cleanField(notes),
      },
    });

    // Decrypt before returning to the frontend
    return Response.json(decryptPatient(patient), { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") ?? "").trim();

    // Search on firstName, lastName, phone only.
    // ahcNumber is encrypted so it cannot be searched via DB query.
    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: [{ id: "asc" }],
      take: 25,
    });

    // Decrypt ahcNumber on every record before returning
    return Response.json(patients.map(decryptPatient));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}