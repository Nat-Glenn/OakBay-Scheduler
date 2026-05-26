import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { withAuthSimple, withRoles } from "@/lib/withAuth";
import { AppRole } from "@/lib/auth/roles";
import { badRequest, conflict, serverError } from "@/lib/api";
import { createPractitionerSchema } from "@/lib/practitioners/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import {
  deleteStaffAuthUser,
  firebaseProvisionErrorMessage,
  provisionStaffAuthUser,
} from "@/lib/firebase/provisionStaffUser";
import {
  ClinicDbRole,
  SCHEDULER_STAFF_ROLES,
} from "@/lib/auth/constants";

export const GET = withAuthSimple(async () => {
  try {
    const practitioners = await prisma.user.findMany({
      where: {
        role: { in: [...SCHEDULER_STAFF_ROLES] },
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

export const POST = withRoles([AppRole.ADMIN], async (req) => {
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

    let firebaseUid: string;
    try {
      const provisioned = await provisionStaffAuthUser({ email, name });
      firebaseUid = provisioned.uid;
    } catch (err) {
      console.error("Firebase provision failed:", err);
      return badRequest(firebaseProvisionErrorMessage(err));
    }

    const hashedPassword = await hashPassword("temp123");

    try {
      const practitioner = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          role: ClinicDbRole.Chiropractor,
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
      await deleteStaffAuthUser(firebaseUid);
      throw err;
    }
  } catch (err) {
    console.error("Failed to create practitioner:", err);
    return serverError("Failed to create practitioner");
  }
});
