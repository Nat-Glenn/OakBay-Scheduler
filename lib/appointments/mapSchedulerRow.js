/**
 * Maps API appointment records to the scheduler grid row shape.
 */

import { calculateAge } from "@/utils/date";
import { dbStatusToUi } from "@/lib/appointments/status";
import {
  formatClinicClockTime,
  formatClinicDateDMY,
} from "@/lib/appointments/clinicTime.js";

export function mapApiAppointmentToSchedulerRow(appt) {
  return {
    id: appt.id,
    name: appt.patient
      ? `${appt.patient.firstName ?? ""} ${appt.patient.lastName ?? ""}`.trim()
      : "Unknown Patient",
    dob: appt.patient?.dob || "—",
    age: calculateAge(appt.patient?.dob) || "—",
    email: appt.patient?.email || "—",
    phone: appt.patient?.phone || "—",
    type: appt.type || "—",
    practitioner: appt.provider?.name || "Unassigned",
    providerId: appt.provider?.id ?? null,
    time: formatClinicClockTime(appt.startTime),
    slot: appt.slot || 1,
    date: formatClinicDateDMY(appt.startTime),
    status: dbStatusToUi(appt.status),
  };
}
