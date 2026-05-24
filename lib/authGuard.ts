/**
 * Firebase Admin authentication for API routes and session cookies.
 * Verifies Bearer ID tokens or the __session HTTP-only cookie.
 */

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const SESSION_COOKIE_NAME = "__session";

/** Five days — matches Firebase session cookie max recommended window. */
export const SESSION_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export type AuthUser = {
  uid: string;
  email?: string;
};

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. " +
        "Download your service account key from Firebase Console > Project Settings > Service Accounts.",
    );
  }

  return initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });
}

function getSessionFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

async function verifyBearerToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.error("Bearer token verification failed:", err);
    return null;
  }
}

async function verifySessionCookieValue(
  sessionCookie: string,
): Promise<AuthUser | null> {
  try {
    const decoded = await getAuth(getAdminApp()).verifySessionCookie(
      sessionCookie,
      true,
    );
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.error("Session cookie verification failed:", err);
    return null;
  }
}

/** Verifies Firebase ID token (Bearer) or session cookie. */
export async function verifyAuth(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyBearerToken(token);
  }

  const sessionCookie = getSessionFromCookieHeader(req.headers.get("cookie"));
  if (sessionCookie) {
    return verifySessionCookieValue(sessionCookie);
  }

  return null;
}

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAuth(getAdminApp()).createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  });
}

export function unauthorized() {
  return Response.json(
    { error: "Unauthorized — valid Firebase session required" },
    { status: 401 },
  );
}
