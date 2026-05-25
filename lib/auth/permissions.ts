/**
 * Route and action permissions by normalized app role.
 * Chiropractors and receptionists share front-desk access; admin manages team.
 */

import { AppRole, type AppRoleValue } from "@/lib/auth/roles";

const ALL_STAFF: AppRoleValue[] = [
  AppRole.ADMIN,
  AppRole.CHIROPRACTOR,
  AppRole.RECEPTIONIST,
];

const ROUTE_ROLES: Record<string, AppRoleValue[]> = {
  "/": ALL_STAFF,
  "/Billing": ALL_STAFF,
  "/Requests": ALL_STAFF,
  "/StaffSchedule": ALL_STAFF,
  "/Practitioners": [AppRole.ADMIN],
  "/Patients": ALL_STAFF,
  "/Patients/AddPatient": ALL_STAFF,
  "/Summary": ALL_STAFF,
  "/Summary/history": ALL_STAFF,
  "/Settings": ALL_STAFF,
};

export function canAccessRoute(pathname: string, role: AppRoleValue): boolean {
  if (ROUTE_ROLES[pathname]) {
    return ROUTE_ROLES[pathname].includes(role);
  }

  const parent = Object.keys(ROUTE_ROLES)
    .filter((route) => route !== "/" && pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];

  if (parent) {
    return ROUTE_ROLES[parent].includes(role);
  }

  return true;
}

export function canManagePractitioners(role: AppRoleValue): boolean {
  return role === AppRole.ADMIN;
}

export function canManageStaffSchedule(role: AppRoleValue): boolean {
  return role === AppRole.ADMIN;
}

export function canViewBilling(role: AppRoleValue): boolean {
  return ALL_STAFF.includes(role);
}

/** Alberta Health Care numbers — chiropractors and admins only (HIA access control). */
export function canViewFullAhc(role: AppRoleValue): boolean {
  return role === AppRole.ADMIN || role === AppRole.CHIROPRACTOR;
}
