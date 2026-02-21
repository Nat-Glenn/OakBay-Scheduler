import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 15/16: params is a Promise, so await it
    const { id: idStr } = await context.params;

    const id = Number(idStr);
    if (!id) {
      return Response.json(
        { error: "Invalid appointment id", id: idStr },
        { status: 400 }
      );
    }

    const body = await req.json();

    const status = body.status ? String(body.status) : undefined;
    const adminNotes =
      body.adminNotes !== undefined ? String(body.adminNotes) : undefined;

    const allowedStatuses = ["requested", "confirmed", "completed", "cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return Response.json(
        { error: "Invalid status value", allowedStatuses },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
      include: { patient: true, provider: true, payment: true },
    });

    return Response.json(updated);
  } catch (err) {
    console.error("PATCH /api/appointments/[id] error:", err);
    return Response.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}