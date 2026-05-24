import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { withAuthSimple } from "@/lib/withAuth";
import { badRequest, conflict, serverError } from "@/lib/api";
import { createPractitionerSchema } from "@/lib/practitioners/schemas";
import { parseBody } from "@/lib/validation/parseBody";

export const GET = withAuthSimple(async () => {
  try {
    const practitioners = await prisma.user.findMany({
      where: {
        role: { in: ["Chiropractor", "provider"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return Response.json(practitioners);
  } catch (err) {
    console.error("Failed to fetch practitioners:", err);
    return serverError("Failed to fetch practitioners");
  }
});

export const POST = withAuthSimple(async (req) => {
  try {
    const body = await req.json();
    const parsed = parseBody(createPractitionerSchema, body);
    if (!parsed.ok) return parsed.response;

    const { name, email, phone } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return conflict("A user with this email already exists");
    }

    const hashedPassword = await hashPassword("temp123");

    const practitioner = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: "provider",
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return Response.json(practitioner, { status: 201 });
  } catch (err) {
    console.error("Failed to create practitioner:", err);
    return serverError("Failed to create practitioner");
  }
});
