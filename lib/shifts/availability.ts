/**
 * Provider shift queries: who is scheduled, who is in office now, bookability checks.
 */

import { prisma } from "@/lib/prisma";
import {
  clinicDatePartsFromParam,
  shiftDateOnly,
} from "@/lib/shifts/clinicShiftTime";
import {
  formatClinicDateIso,
  parseClinicDateParam,
} from "@/lib/appointments/clinicTime";
import { ClinicDbRole, SCHEDULER_STAFF_ROLES } from "@/lib/auth/constants";

const shiftProviderSelect = {
  id: true,
  name: true,
  email: true,
} as const;

export type ShiftWithProvider = {
  id: number;
  providerId: number;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  provider: { id: number; name: string; email: string };
};

export async function getShiftsBetween(
  from: string,
  to: string,
): Promise<ShiftWithProvider[]> {
  const fromParts = parseClinicDateParam(from);
  const toParts = parseClinicDateParam(to);
  if (!fromParts || !toParts) return [];

  return prisma.providerShift.findMany({
    where: {
      shiftDate: {
        gte: shiftDateOnly(fromParts),
        lte: shiftDateOnly(toParts),
      },
    },
    include: { provider: { select: shiftProviderSelect } },
    orderBy: [{ shiftDate: "asc" }, { providerId: "asc" }, { startTime: "asc" }],
  });
}

export async function getShiftsForClinicDay(
  dateParam: string,
): Promise<ShiftWithProvider[]> {
  const parts = clinicDatePartsFromParam(dateParam);
  if (!parts) return [];

  const day = shiftDateOnly(parts);

  return prisma.providerShift.findMany({
    where: { shiftDate: day },
    include: { provider: { select: shiftProviderSelect } },
    orderBy: [{ providerId: "asc" }, { startTime: "asc" }],
  });
}

/** Chiropractors with a shift covering `instant` (typically now). */
export async function getProvidersInOffice(
  at: Date = new Date(),
): Promise<ShiftWithProvider[]> {
  const shifts = await prisma.providerShift.findMany({
    where: {
      startTime: { lte: at },
      endTime: { gt: at },
      provider: { role: { in: [...SCHEDULER_STAFF_ROLES] } },
    },
    include: { provider: { select: shiftProviderSelect } },
    orderBy: { provider: { name: "asc" } },
  });

  const seen = new Set<number>();
  return shifts.filter((s) => {
    if (seen.has(s.providerId)) return false;
    seen.add(s.providerId);
    return true;
  });
}

/** When false, no shifts exist that day — booking is not restricted by schedule yet. */
export async function isShiftEnforcementActiveForInstant(
  startTime: Date,
): Promise<boolean> {
  const day = shiftDateOnlyFromInstant(startTime);
  const count = await prisma.providerShift.count({
    where: { shiftDate: day },
  });
  return count > 0;
}

function shiftDateOnlyFromInstant(instant: Date) {
  const iso = formatClinicDateIso(instant);
  const parts = parseClinicDateParam(iso);
  if (!parts) {
    throw new Error("Invalid clinic date");
  }
  return shiftDateOnly(parts);
}

export async function isProviderScheduledForRange(opts: {
  providerId: number;
  startTime: Date;
  endTime: Date;
}): Promise<boolean> {
  const { providerId, startTime, endTime } = opts;

  const enforcing = await isShiftEnforcementActiveForInstant(startTime);
  if (!enforcing) {
    return true;
  }

  const shift = await prisma.providerShift.findFirst({
    where: {
      providerId,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
    },
  });

  return Boolean(shift);
}

export async function getBookableProviderIdsForInstant(
  startTime: Date,
  endTime: Date,
): Promise<number[]> {
  const shifts = await prisma.providerShift.findMany({
    where: {
      startTime: { lte: startTime },
      endTime: { gte: endTime },
      provider: { role: ClinicDbRole.Chiropractor },
    },
    select: { providerId: true },
  });

  return [...new Set(shifts.map((s) => s.providerId))];
}

/** Provider IDs with any shift on a clinic calendar day. */
export async function getScheduledProviderIdsForDay(
  dateParam: string,
): Promise<number[]> {
  const shifts = await getShiftsForClinicDay(dateParam);
  return [...new Set(shifts.map((s) => s.providerId))];
}
