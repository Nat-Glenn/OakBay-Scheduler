/**
 * Shared pending booking-request count for the sidebar badge — polled once at
 * app root so navigation does not reset the count to zero while refetching.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/utils/apiFetch";
import { useSessionUser } from "@/utils/SessionProvider";
import { filterNavItems } from "@/lib/navigation";

const POLL_MS = 60_000;

const PendingRequestContext = createContext({
  count: 0,
  refresh: () => {},
});

export function PendingRequestProvider({ children }) {
  const { session, loading: sessionLoading } = useSessionUser();
  const canSeeRequests = useMemo(() => {
    const items = filterNavItems(session?.allowedRoutes);
    return items.some((item) => item.href === "/Requests");
  }, [session?.allowedRoutes]);

  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!canSeeRequests) {
      setCount(0);
      return;
    }

    try {
      const res = await apiFetch("/api/booking-requests?status=PENDING");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCount(data.length);
      }
    } catch {
      // Non-blocking — keep last known count
    }
  }, [canSeeRequests]);

  useEffect(() => {
    if (sessionLoading) return;

    refresh();

    const intervalId = setInterval(refresh, POLL_MS);
    const onRefresh = () => refresh();

    window.addEventListener("focus", onRefresh);
    window.addEventListener("booking-requests-updated", onRefresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("booking-requests-updated", onRefresh);
    };
  }, [refresh, sessionLoading]);

  const value = useMemo(() => ({ count, refresh }), [count, refresh]);

  return (
    <PendingRequestContext.Provider value={value}>
      {children}
    </PendingRequestContext.Provider>
  );
}

export function usePendingRequestCount() {
  return useContext(PendingRequestContext);
}
