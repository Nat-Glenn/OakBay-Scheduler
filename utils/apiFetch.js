/**
 * Authenticated fetch wrapper — sends session cookie on same-origin requests.
 */

import { isAuthSkippedClient } from "@/utils/authConfig";

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !isAuthSkippedClient()
  ) {
    window.location.href = "/Login";
  }

  return res;
}
