/**
 * Wraps App Router handlers with Firebase authentication.
 * Supports Bearer tokens and the __session HTTP-only cookie.
 */

import { isAuthSkipped } from "@/lib/authConfig";
import { verifyAuth, unauthorized, type AuthUser } from "@/lib/authGuard";

const DEV_USER: AuthUser = {
  uid: "dev-bypass",
  email: "dev@local.test",
};

type RouteContext = { params: Promise<Record<string, string>> };

type AuthenticatedHandler = (
  req: Request,
  ctx: RouteContext,
  user: AuthUser,
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, ctx: RouteContext) => {
    if (isAuthSkipped()) {
      return handler(req, ctx, DEV_USER);
    }
    const user = await verifyAuth(req);
    if (!user) return unauthorized();
    return handler(req, ctx, user);
  };
}

type SimpleHandler = (req: Request, user: AuthUser) => Promise<Response>;

/** For routes without dynamic params. */
export function withAuthSimple(handler: SimpleHandler) {
  return async (req: Request) => {
    if (isAuthSkipped()) {
      return handler(req, DEV_USER);
    }
    const user = await verifyAuth(req);
    if (!user) return unauthorized();
    return handler(req, user);
  };
}
