/**
 * Loads the signed-in clinic user profile and allowed routes from /api/auth/me.
 */

"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/apiFetch";

export function useSessionUser() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await apiFetch("/api/auth/me");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load session");
        }

        if (!ignore) setSession(data);
      } catch (err) {
        if (!ignore) {
          setSession(null);
          setError(err.message || "Failed to load session");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  return { session, loading, error };
}
