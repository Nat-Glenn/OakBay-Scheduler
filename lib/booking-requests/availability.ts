/**
 * Public /book availability — future slots with staff on shift and clinic capacity.
 */

import { prisma } from "@/lib/prisma";
import { getOfficeTimeSlotsForDate, isClinicOpenOnDate } from "@/lib/clinic/officeHours.js";
import {
  getClinicDayBounds,
  formatDateOnlyIso,
  parseClinicDateParam,
} from "@/lib/appointments/clinicTime";
import {
  MAX_CLINIC_SLOTS_PER_TIME,
  SLOT_BLOCKING_STATUSES,
} from "@/lib/appointments/clinicSlots";
import {
  getShiftsBetween,
  getShiftsForClinicDay,
} from "@/lib/shifts/availability";
import { preferenceToTimeRange, isPreferenceInFuture } from "./times";

function providersCoveringSlot(
  shifts: Awaited<ReturnType<typeof getShiftsForClinicDay>>,
  startTime: Date,
  endTime: Date,
): number[] {
  return [
    ...new Set(
      shifts
        .filter(
          (s) =>
            s.startTime.getTime() <= startTime.getTime() &&
            s.endTime.getTime() >= endTime.getTime(),
        )
        .map((s) => s.providerId),
    ),
  ];
}

/** True when patients can request this date/time (staff scheduled + open capacity). */
export async function isPublicRequestSlotAvailable(
  dateParam: string,
  clock: string,
): Promise<boolean> {
  const slots = await getPublicBookableSlotsForDay(dateParam);
  return slots.includes(clock);
}

/** Bookable HH:mm clocks for a clinic calendar day. */
export async function getPublicBookableSlotsForDay(
  dateParam: string,
): Promise<string[]> {
  const parts = parseClinicDateParam(dateParam);
  if (!parts) return [];

  if (!isClinicOpenOnDate(dateParam)) return [];

  const shifts = await getShiftsForClinicDay(dateParam);
  if (shifts.length === 0) return [];

  const { start: dayStart, end: dayEnd } = getClinicDayBounds(parts);

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: SLOT_BLOCKING_STATUSES },
    },
    select: { startTime: true, providerId: true },
  });

  const bookedByStartMs = new Map<number, Set<number>>();
  for (const appt of appointments) {
    if (appt.providerId == null) continue;
    const key = appt.startTime.getTime();
    if (!bookedByStartMs.has(key)) {
      bookedByStartMs.set(key, new Set());
    }
    bookedByStartMs.get(key)!.add(appt.providerId);
  }

  const available: string[] = [];

  for (const clock of getOfficeTimeSlotsForDate(dateParam)) {
    let range;
    try {
      range = preferenceToTimeRange(dateParam, clock);
    } catch {
      continue;
    }

    if (!isPreferenceInFuture(range.startTime)) continue;

    const onShiftIds = providersCoveringSlot(
      shifts,
      range.startTime,
      range.endTime,
    );
    if (onShiftIds.length === 0) continue;

    const booked = bookedByStartMs.get(range.startTime.getTime());
    if ((booked?.size ?? 0) >= MAX_CLINIC_SLOTS_PER_TIME) continue;

    const hasOpenProvider = onShiftIds.some((id) => !booked?.has(id));
    if (!hasOpenProvider) continue;

    available.push(clock);
  }

  return available;
}

/** YYYY-MM-DD dates in range that have at least one bookable slot. */
export async function getPublicBookableDatesBetween(
  from: string,
  to: string,
): Promise<string[]> {
  const fromParts = parseClinicDateParam(from);
  const toParts = parseClinicDateParam(to);
  if (!fromParts || !toParts) return [];

  const shifts = await getShiftsBetween(from, to);
  const datesWithShifts = [
    ...new Set(shifts.map((s) => formatDateOnlyIso(s.shiftDate))),
  ].sort();

  const bookable: string[] = [];

  for (const date of datesWithShifts) {
    if (date < from || date > to) continue;
    if (!isClinicOpenOnDate(date)) continue;
    const slots = await getPublicBookableSlotsForDay(date);
    if (slots.length > 0) bookable.push(date);
  }

  return bookable;
}

/** Default search window for public booking (today through ~3 months). */
export function getPublicBookingAvailabilityRange(
  fromDate = new Date(),
): { from: string; to: string } {
  const y = fromDate.getFullYear();
  const m = String(fromDate.getMonth() + 1).padStart(2, "0");
  const d = String(fromDate.getDate()).padStart(2, "0");
  const from = `${y}-${m}-${d}`;

  const end = new Date(fromDate);
  end.setMonth(end.getMonth() + 3);
  const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  return { from, to };
}
