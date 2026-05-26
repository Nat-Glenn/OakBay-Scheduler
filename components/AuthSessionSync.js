"use client";

/**
 * Keeps the HTTP-only session cookie in sync with Firebase client auth.
 */

import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";
import { syncAuthSession } from "@/utils/authSession";
import { isAuthSkippedClient } from "@/utils/authConfig";

export default function AuthSessionSync() {
  useEffect(() => {
    if (isAuthSkippedClient()) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          await user.reload();
          if (!user.emailVerified) {
            await fetch("/api/auth/session", {
              method: "DELETE",
              credentials: "include",
            });
            await signOut(auth);
            return;
          }
        }
        await syncAuthSession();
      } catch (err) {
        console.error("Auth session sync failed:", err);
      }
    });

    return () => unsub();
  }, []);

  return null;
}
