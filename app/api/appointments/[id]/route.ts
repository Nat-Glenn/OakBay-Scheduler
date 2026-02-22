import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("Invalid appointment id", { id: idStr });
    }

    const body = await req.json();

    const status = body.status ? String(body.status) : undefined;
    const adminNotes = body.adminNotes !== undefined ? String(body.adminNotes) : undefined;

    const allowedStatuses = ["requested", "confirmed", "completed", "cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return badRequest("Invalid status value", { allowedStatuses });
    }

    // Return 404 instead of 500 if not found
    const exists = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return notFound("Appointment not found");

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
      include: { patient: true, provider: true, payment: true },
    });

    return ok(updated);
  } catch (err) {
    console.error(err);
    return serverError("Failed to update appointment");
  }
}