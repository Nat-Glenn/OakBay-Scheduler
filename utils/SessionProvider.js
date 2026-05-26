/**
 * Shared clinic session state — loaded once at app root so navigation does not
 * refetch /api/auth/me or flash the sidebar user block.
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";
import { isAuthSkippedClient } from "@/utils/authConfig";

function isPublicAppPath(pathname) {
  if (!pathname) return false;
  return (
    pathname === "/Login" ||
    pathname.startsWith("/Login/") ||
    pathname === "/book" ||
    pathname.startsWith("/book/")
  );
}

const SessionContext = createContext({
  session: null,
  loading: true,
  error: "",
});

export function SessionProvider({ children }) {
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (isPublicAppPath(pathname) && !isAuthSkippedClient()) {
        if (!ignore) {
          setSession(null);
          setError("");
          setLoading(false);
        }
        return;
      }

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
  }, [pathname]);

  return (
    <SessionContext.Provider value={{ session, loading, error }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionUser() {
  return useContext(SessionContext);
}
