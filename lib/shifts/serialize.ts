/**
 * API-friendly shift payloads with clinic date and clock labels.
 */

import {
  formatClinicClockTime,
  formatDateOnlyIso,
} from "@/lib/appointments/clinicTime";
import { normalizeShiftClock } from "@/lib/shifts/clinicShiftTime";
import type { ShiftWithProvider } from "@/lib/shifts/availability";

export function serializeShift(shift: ShiftWithProvider) {
  const startClock = normalizeShiftClock(
    formatClinicClockTime(shift.startTime),
  );
  const endClock = normalizeShiftClock(formatClinicClockTime(shift.endTime));

  return {
    id: shift.id,
    providerId: shift.providerId,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    notes: shift.notes,
    date: formatDateOnlyIso(shift.shiftDate),
    startClock,
    endClock,
    provider: shift.provider,
  };
}
