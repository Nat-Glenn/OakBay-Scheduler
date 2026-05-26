/**
 * Firebase Admin authentication for API routes and session cookies.
 * Verifies Bearer ID tokens or the __session HTTP-only cookie.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function loadServiceAccountRaw(): string {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (filePath) {
    const absolute = resolve(process.cwd(), filePath);
    return readFileSync(absolute, "utf8");
  }

  return process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
}

export const SESSION_COOKIE_NAME = "__session";

/** Five days — matches Firebase session cookie max recommended window. */
export const SESSION_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export type AuthUser = {
  uid: string;
  email?: string;
};

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = loadServiceAccountRaw();

  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH (path to downloaded JSON) or FIREBASE_SERVICE_ACCOUNT_JSON in .env.local.",
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(serviceAccount) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Firebase service account is not valid JSON. Use FIREBASE_SERVICE_ACCOUNT_PATH pointing at the downloaded key file, or paste the full JSON on one line in FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
  }

  return initializeApp({
    credential: cert(parsed),
  });
}

/** Firebase Admin Auth — used for session verification and staff provisioning. */
export function getFirebaseAdminAuth(): Auth {
  return getAuth(getAdminApp());
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
