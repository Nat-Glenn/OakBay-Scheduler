/**
 * Exchanges a Firebase ID token for an HTTP-only session cookie (POST)
 * or clears the session on sign-out (DELETE).
 */

import { cookies } from "next/headers";
import {
  createSessionCookie,
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
} from "@/lib/authGuard";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = String(body.idToken ?? "").trim();

    if (!idToken) {
      return Response.json({ error: "idToken is required" }, { status: 400 });
    }

    const sessionCookie = await createSessionCookie(idToken);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_COOKIE_MAX_AGE_MS / 1000),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Failed to create session cookie:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create session";
    const isConfig =
      message.includes("FIREBASE_SERVICE_ACCOUNT_JSON") ||
      message.includes("service account") ||
      message.includes("not valid JSON");
    return Response.json(
      {
        error: isConfig
          ? "Server auth is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in .env.local."
          : "Invalid or expired token",
      },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
