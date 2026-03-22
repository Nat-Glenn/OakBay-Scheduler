import { prisma } from "@/lib/prisma";

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

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        ahcNumber: ahcNumber || null,
        reminderOptIn: body.reminderOptIn ?? true,
        notes: notes || null,
      },
    });

    return Response.json(patient, { status: 201 });
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

    // Simple search: first name OR last name OR phone
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
      orderBy: [{id: "asc"}],
      take: 25,
    });

    return Response.json(patients);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}
