/**
 * Serialize booking requests for API responses.
 */

import {
  formatClinicClockTime,
  formatClinicDateDMY,
} from "@/lib/appointments/clinicTime";

type Preference = {
  id: number;
  startTime: Date;
  endTime: Date;
  sortOrder: number;
};

export function formatPreferenceLabel(pref: Preference) {
  const date = formatClinicDateDMY(pref.startTime);
  const time = formatClinicClockTime(pref.startTime);
  return `${date} at ${time}`;
}

export function serializeBookingRequest(
  request: {
    id: number;
    status: string;
    patientKind?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    type: string;
    message: string | null;
    preferredProviderName: string | null;
    patientId: number | null;
    appointmentId: number | null;
    reviewedAt: Date | null;
    declineReason: string | null;
    createdAt: Date;
    preferences: Preference[];
    reviewedBy?: { id: number; name: string } | null;
    appointment?: { id: number; startTime: Date; status: string } | null;
  },
) {
  return {
    ...request,
    preferences: request.preferences.map((p) => ({
      ...p,
      label: formatPreferenceLabel(p),
    })),
  };
}
