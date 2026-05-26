/**
 * Convert public booking preference date + clock into UTC instants (clinic TZ).
 */

import { parseClinicDateParam } from "@/lib/appointments/clinicTime";
import { clinicClockToUtc } from "@/lib/shifts/clinicShiftTime";
import { APPOINTMENT_SLOT_MINUTES } from "./constants";

export function preferenceToTimeRange(date: string, clock: string) {
  const parts = parseClinicDateParam(date);
  if (!parts) {
    throw new Error("Invalid preference date");
  }

  const startTime = clinicClockToUtc(parts, clock);
  const endTime = new Date(startTime);
  endTime.setUTCMinutes(endTime.getUTCMinutes() + APPOINTMENT_SLOT_MINUTES);

  return { startTime, endTime };
}

export function isPreferenceInFuture(startTime: Date): boolean {
  return startTime.getTime() > Date.now();
}
