/**
 * Authenticated app chrome — sidebar and shell persist across dashboard routes
 * so navigation does not remount session badges or the user footer.
 */

"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getPageTitle } from "@/lib/navigation";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return <AppShell title={title}>{children}</AppShell>;
}
