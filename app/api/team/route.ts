/**
 * Clinic team directory — list all staff (GET); create staff member (POST, admin).
 * Scheduler booking continues to use GET /api/practitioners (chiropractors only).
 */

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { withAuthSimple, withRoles } from "@/lib/withAuth";
import { AppRole } from "@/lib/auth/roles";
import { badRequest, conflict, created, serverError } from "@/lib/api";
import { createTeamMemberSchema } from "@/lib/team/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import {
  deleteStaffAuthUser,
  firebaseProvisionErrorMessage,
  provisionStaffAuthUser,
} from "@/lib/firebase/provisionStaffUser";

const teamSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
} as const;

export const GET = withAuthSimple(async () => {
  try {
    const members = await prisma.user.findMany({
      select: teamSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return Response.json(members);
  } catch (err) {
    console.error("Failed to fetch team:", err);
    return serverError("Failed to fetch team");
  }
});

export const POST = withRoles([AppRole.ADMIN], async (req) => {
  try {
    const body = await req.json();
    const parsed = parseBody(createTeamMemberSchema, body);
    if (!parsed.ok) return parsed.response;

    const { name, email, phone, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
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
      const member = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          role,
          password: hashedPassword,
        },
        select: teamSelect,
      });

      return created(member);
    } catch (err) {
      await deleteStaffAuthUser(firebaseUid);
      console.error("Failed to create team member:", err);
      return serverError("Failed to create team member");
    }
  } catch (err) {
    console.error("Failed to create team member:", err);
    return serverError("Failed to create team member");
  }
});
