/**
 * Wraps App Router handlers with Firebase authentication and clinic role resolution.
 */

import { isAuthSkipped } from "@/lib/authConfig";
import { verifyAuth, unauthorized, type AuthUser } from "@/lib/authGuard";
import { forbidden } from "@/lib/api";
import { resolveAppUser, type AppSessionUser } from "@/lib/auth/resolveUser";
import { type AppRoleValue } from "@/lib/auth/roles";

const DEV_USER: AuthUser = {
  uid: "dev-bypass",
  email: "brad.pritchard@oakbay.com",
};

type RouteContext = { params: Promise<Record<string, string>> };

type AuthenticatedHandler = (
  req: Request,
  ctx: RouteContext,
  user: AppSessionUser,
) => Promise<Response>;

async function authenticate(req: Request): Promise<AppSessionUser | Response> {
  const authUser = isAuthSkipped()
    ? DEV_USER
    : await verifyAuth(req);

  if (!authUser) return unauthorized();

  const sessionUser = await resolveAppUser(authUser);
  if (!sessionUser) {
    return forbidden(
      "Your account is not linked to a clinic user. Ask an administrator to add your email in Practitioners.",
    );
  }

  return sessionUser;
}

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, ctx: RouteContext) => {
    const result = await authenticate(req);
    if (result instanceof Response) return result;
    return handler(req, ctx, result);
  };
}

type SimpleHandler = (req: Request, user: AppSessionUser) => Promise<Response>;

/** For routes without dynamic params. */
export function withAuthSimple(handler: SimpleHandler) {
  return async (req: Request) => {
    const result = await authenticate(req);
    if (result instanceof Response) return result;
    return handler(req, result);
  };
}

/** Restricts a handler to specific normalized app roles. */
export function withRoles(
  allowed: AppRoleValue[],
  handler: SimpleHandler,
) {
  return withAuthSimple(async (req, user) => {
    if (!allowed.includes(user.role)) {
      return forbidden("You do not have permission to perform this action.");
    }
    return handler(req, user);
  });
}
