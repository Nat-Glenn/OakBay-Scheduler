/**
 * App navigation config and page title helpers for AppShell / SidebarNav.
 */

export const NAV_ITEMS = [
  { href: "/", label: "Appointments", shortLabel: "Scheduler" },
  { href: "/Billing", label: "Billing" },
  { href: "/Practitioners", label: "Practitioners" },
  { href: "/Patients", label: "Patients" },
  { href: "/Summary", label: "Summary" },
  { href: "/Settings", label: "Settings" },
];

const PAGE_TITLES = {
  "/": "Scheduler",
  "/Billing": "Billing",
  "/Practitioners": "Practitioners",
  "/Patients": "Patients",
  "/Patients/AddPatient": "Add Patient",
  "/Summary": "Summary",
  "/Summary/history": "Visit History",
  "/Settings": "Settings",
};

/** Human-readable title for the current route (top bar on mobile, optional desktop use). */
export function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const item = NAV_ITEMS.find(
    (entry) => entry.href !== "/" && pathname.startsWith(entry.href),
  );
  if (item) return item.label;

  const segment = pathname.split("/").filter(Boolean)[0];
  return segment || "Oak Bay Scheduler";
}

export function isNavActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Filters sidebar items when an allowedRoutes list is provided from /api/auth/me. */
export function filterNavItems(allowedRoutes) {
  if (!allowedRoutes?.length) return NAV_ITEMS;
  const allowed = new Set(allowedRoutes);
  return NAV_ITEMS.filter((item) => allowed.has(item.href));
}
