import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const patient = await prisma.patient.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email ?? null,
        ahcNumber: body.ahcNumber ?? null,
        reminderOptIn: body.reminderOptIn ?? true,
        notes: body.notes ?? null,
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
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 25,
    });

    return Response.json(patients);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}
