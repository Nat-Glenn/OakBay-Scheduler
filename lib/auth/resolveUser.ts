/**
 * Links a Firebase auth identity to a clinic User row (role, id, name).
 * Supports dev impersonation of Brad Pritchard when clinic emails are not set up yet.
 */

import { prisma } from "@/lib/prisma";
import { isAuthSkipped, shouldImpersonateAdmin } from "@/lib/authConfig";
import type { AuthUser } from "@/lib/authGuard";
import { AppRole, normalizeDbRole, type AppRoleValue } from "@/lib/auth/roles";

export type AppSessionUser = AuthUser & {
  dbUserId: number;
  name: string;
  dbRole: string;
  role: AppRoleValue;
};

export const BRAD_PRITCHARD_EMAIL = "brad.pritchard@oakbay.com";

async function loadBradSessionUser(
  authUser: AuthUser,
): Promise<AppSessionUser | null> {
  const brad = await prisma.user.findUnique({
    where: { email: BRAD_PRITCHARD_EMAIL },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!brad) {
    console.error(
      `Impersonation failed: no user found for ${BRAD_PRITCHARD_EMAIL}. Run prisma db seed.`,
    );
    return null;
  }

  return {
    uid: authUser.uid,
    email: brad.email,
    dbUserId: brad.id,
    name: brad.name,
    dbRole: brad.role,
    role: AppRole.ADMIN,
  };
}

export async function resolveAppUser(
  authUser: AuthUser,
): Promise<AppSessionUser | null> {
  if (isAuthSkipped() || shouldImpersonateAdmin()) {
    return loadBradSessionUser(authUser);
  }

  const email = authUser.email?.trim().toLowerCase();
  if (!email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!dbUser) {
    if (process.env.NODE_ENV !== "production") {
      return loadBradSessionUser(authUser);
    }
    return null;
  }

  const role = normalizeDbRole(dbUser.role, dbUser.email);

  return {
    uid: authUser.uid,
    email: dbUser.email,
    dbUserId: dbUser.id,
    name: dbUser.name,
    dbRole: dbUser.role,
    role,
  };
}
