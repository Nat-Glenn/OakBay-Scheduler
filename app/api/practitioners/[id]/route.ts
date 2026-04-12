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
      return badRequest("Invalid practitioner id", { id: idStr });
    }

    const body = await req.json();

    const name =
      body.name !== undefined ? String(body.name).trim() : undefined;

    const email =
      body.email !== undefined ? String(body.email).trim() : undefined;

    const phone =
      body.phone !== undefined ? String(body.phone).trim() : undefined;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      return notFound("Practitioner not found");
    }

    // Check email isn't already taken by another user
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailTaken) {
        return badRequest("A user with this email already exists");
      }
    }

    const updatedPractitioner = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
      
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return ok(updatedPractitioner);
  } catch (err) {
    console.error("PATCH /api/practitioners/[id] error:", err);
    return serverError("Failed to update practitioner");
  }
}