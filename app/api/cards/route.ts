import { prisma } from "@/lib/prisma";

function normalizeLast4(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.slice(-4);
}

function parseOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientIdParam = searchParams.get("patientId");

    if (!patientIdParam) {
      return Response.json({ error: "patientId is required" }, { status: 400 });
    }

    const patientId = Number(patientIdParam);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return Response.json({ error: "Invalid patientId" }, { status: 400 });
    }

    const cards = await prisma.card.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(cards);
  } catch (error) {
    console.error("GET /api/cards error:", error);
    return Response.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const patientId = Number(body.patientId);
    const brand = String(body.brand ?? "").trim();
    const last4 = normalizeLast4(body.last4 ?? body.number);
    const expMonth = parseOptionalInt(body.expMonth);
    const expYear = parseOptionalInt(body.expYear);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return Response.json({ error: "Invalid patientId" }, { status: 400 });
    }

    if (!brand) {
      return Response.json({ error: "Card brand is required" }, { status: 400 });
    }

    if (last4.length !== 4) {
      return Response.json({ error: "Last 4 digits are required" }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    const card = await prisma.card.create({
      data: {
        patientId,
        brand,
        last4,
        expMonth,
        expYear,
      },
    });

    return Response.json(card, { status: 201 });
  } catch (error) {
    console.error("POST /api/cards error:", error);
    return Response.json({ error: "Failed to create card" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const id = Number(body.id);
    const brand = String(body.brand ?? "").trim();
    const last4 = normalizeLast4(body.last4);
    const expMonth = parseOptionalInt(body.expMonth);
    const expYear = parseOptionalInt(body.expYear);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid card id" }, { status: 400 });
    }

    if (!brand) {
      return Response.json({ error: "Card brand is required" }, { status: 400 });
    }

    if (last4.length !== 4) {
      return Response.json({ error: "Last 4 digits are required" }, { status: 400 });
    }

    const existing = await prisma.card.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return Response.json({ error: "Card not found" }, { status: 404 });
    }

    const updated = await prisma.card.update({
      where: { id },
      data: {
        brand,
        last4,
        expMonth,
        expYear,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/cards error:", error);
    return Response.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid card id" }, { status: 400 });
    }

    const existing = await prisma.card.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return Response.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.card.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/cards error:", error);
    return Response.json({ error: "Failed to delete card" }, { status: 500 });
  }
}