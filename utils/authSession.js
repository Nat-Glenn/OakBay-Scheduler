/**
 * Syncs Firebase client auth with the server-side session cookie.
 * Called after login and whenever auth state changes.
 */

import { auth } from "@/app/Login/Firebase/firebase";

export async function syncAuthSession() {
  const user = auth.currentUser;

  if (!user) {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
    return;
  }

  const idToken = await user.getIdToken();

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to establish session");
  }
}
