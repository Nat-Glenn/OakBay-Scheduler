/**
 * Returns the signed-in clinic user profile and role for UI permissions.
 */

import { withAuthSimple } from "@/lib/withAuth";
import { roleLabel } from "@/lib/auth/roles";
import { canAccessRoute } from "@/lib/auth/permissions";
import { NAV_ITEMS } from "@/lib/navigation";

export const GET = withAuthSimple(async (_req, user) => {
  const allowedRoutes = NAV_ITEMS.filter((item) =>
    canAccessRoute(item.href, user.role),
  ).map((item) => item.href);

  return Response.json({
    id: user.dbUserId,
    name: user.name,
    email: user.email,
    role: user.role,
    dbRole: user.dbRole,
    roleLabel: roleLabel(user.role),
    allowedRoutes,
  });
});
