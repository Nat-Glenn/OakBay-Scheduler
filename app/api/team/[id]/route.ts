/**
 * Update a clinic team member (PATCH, admin only).
 */

import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { withAuth } from "@/lib/withAuth";
import { AppRole } from "@/lib/auth/roles";
import { patchTeamMemberSchema } from "@/lib/team/schemas";
import { parseBody } from "@/lib/validation/parseBody";
import {
  firebaseProvisionErrorMessage,
  syncStaffAuthEmailChange,
  syncStaffAuthProfile,
} from "@/lib/firebase/provisionStaffUser";

const teamSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
} as const;

export const PATCH = withAuth(async (req, context, user) => {
  if (user.role !== AppRole.ADMIN) {
    return Response.json(
      { error: "You do not have permission to manage team members." },
      { status: 403 },
    );
  }

  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("Invalid team member id", { id: idStr });
    }

    const body = await req.json();
    const parsed = parseBody(patchTeamMemberSchema, body);
    if (!parsed.ok) return parsed.response;

    const { name, email, phone, role } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!existing) {
      return notFound("Team member not found");
    }

    const nextEmail = email ?? existing.email;
    const nextName = name ?? existing.name;

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailTaken && emailTaken.id !== id) {
        return badRequest("A user with this email already exists");
      }
    }

    try {
      if (email && email !== existing.email) {
        await syncStaffAuthEmailChange({
          previousEmail: existing.email,
          nextEmail,
          name: nextName,
        });
      } else {
        await syncStaffAuthProfile({ email: existing.email, name: nextName });
      }
    } catch (err) {
      console.error("Firebase sync failed:", err);
      return badRequest(firebaseProvisionErrorMessage(err));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(role !== undefined ? { role } : {}),
      },
      select: teamSelect,
    });

    return ok(updated);
  } catch (err) {
    console.error("PATCH /api/team/[id] error:", err);
    return serverError("Failed to update team member");
  }
});
