import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { withAuth } from "@/lib/withAuth";
import { patchPractitionerSchema } from "@/lib/practitioners/schemas";
import { parseBody } from "@/lib/validation/parseBody";

export const PATCH = withAuth(async (req, context) => {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("Invalid practitioner id", { id: idStr });
    }

    const body = await req.json();
    const parsed = parseBody(patchPractitionerSchema, body);
    if (!parsed.ok) return parsed.response;

    const { name, email, phone } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      return notFound("Practitioner not found");
    }

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
});
