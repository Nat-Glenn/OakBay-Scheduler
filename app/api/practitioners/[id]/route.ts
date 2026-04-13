import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";

// Only letters, spaces, hyphens, and apostrophes — no numbers in names
const nameRegex = /^[a-zA-Z\s'\-]+$/;

// Basic email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone: optional +, then digits/spaces/hyphens/dots/parens, 7–15 chars
const phoneRegex = /^\+?[\d\s\-().]{7,15}$/;

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

    // Name: letters only, max 50 characters (only validate if field is being updated)
    if (name !== undefined) {
      if (!nameRegex.test(name)) {
        return badRequest("Name can only contain letters, spaces, hyphens, and apostrophes");
      }
      if (name.length > 50) {
        return badRequest("Name cannot exceed 50 characters");
      }
    }

    // Phone format validation (only validate if field is being updated)
    if (phone !== undefined && phone !== "" && !phoneRegex.test(phone)) {
      return badRequest("Invalid phone number format");
    }

    // Email format and length validation (only validate if field is being updated)
    if (email !== undefined) {
      if (email.length > 254) {
        return badRequest("Email cannot exceed 254 characters");
      }
      if (!emailRegex.test(email)) {
        return badRequest("Invalid email format");
      }
    }

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