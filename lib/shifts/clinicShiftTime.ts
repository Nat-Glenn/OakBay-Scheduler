/**
 * Build UTC instants for provider shifts from clinic calendar date + clock strings.
 */

import {
  getClinicUtcOffsetMs,
  parseClinicDateParam,
  type ClinicDateParts,
} from "@/lib/appointments/clinicTime";

/** Normalize API/UI clock strings to HH:mm for time inputs. */
export function normalizeShiftClock(clock: string): string {
  const [hourPart, minutePart = "00"] = clock.trim().split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return clock;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
import {
  DEFAULT_SHIFT_END_CLOCK,
  DEFAULT_SHIFT_START_CLOCK,
} from "./constants";
import { getDefaultShiftClocksForDate } from "@/lib/clinic/officeHours.js";

export function clinicDatePartsFromParam(
  dateParam: string,
): ClinicDateParts | null {
  return parseClinicDateParam(dateParam);
}

/**
 * Calendar day for ProviderShift.shiftDate (@db.Date).
 * Uses UTC noon so JS/Postgres never shift the day when serializing.
 */
export function shiftDateOnly(parts: ClinicDateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
}

/** @deprecated Use shiftDateOnly */
export const shiftDateUtc = shiftDateOnly;

export function clinicClockToUtc(
  parts: ClinicDateParts,
  clock: string,
): Date {
  const [hour, minute] = clock.split(":").map(Number);
  const offsetMs = getClinicUtcOffsetMs(new Date());
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0) +
      offsetMs,
  );
}

export function defaultShiftBounds(parts: ClinicDateParts) {
  const dateIso = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const clocks = getDefaultShiftClocksForDate(dateIso);
  if (!clocks) {
    return {
      startTime: clinicClockToUtc(parts, DEFAULT_SHIFT_START_CLOCK),
      endTime: clinicClockToUtc(parts, DEFAULT_SHIFT_END_CLOCK),
      startClock: DEFAULT_SHIFT_START_CLOCK,
      endClock: DEFAULT_SHIFT_END_CLOCK,
    };
  }
  return {
    startTime: clinicClockToUtc(parts, clocks.startClock),
    endTime: clinicClockToUtc(parts, clocks.endClock),
    startClock: clocks.startClock,
    endClock: clocks.endClock,
  };
}
