"use client";

/**
 * Visible reminder that Firebase auth is bypassed in local development.
 */

import { usePathname } from "next/navigation";
import { isAuthSkippedClient } from "@/utils/authConfig";

export default function DevAuthBanner() {
  const pathname = usePathname();

  if (!isAuthSkippedClient()) return null;
  if (pathname?.startsWith("/book")) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-xs font-medium py-1.5 px-3 z-50">
      Local dev: authentication is off (NEXT_PUBLIC_SKIP_AUTH). Remove before
      production. Re-enable after Firebase access is configured.
    </div>
  );
}
