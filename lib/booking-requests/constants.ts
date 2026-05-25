/**
 * Public booking form options — patient-facing appointment types.
 */

export const PUBLIC_BOOKING_TYPES = [
  "Initial Consultation",
  "Chiropractic Adjustment",
  "Follow-up",
  "Massage",
  "Intense Massage",
] as const;

export const MAX_BOOKING_PREFERENCES = 4;
export const APPOINTMENT_SLOT_MINUTES = 15;

/** Max submissions per email per hour (backstop; one pending request is also enforced). */
export const BOOKING_REQUEST_RATE_LIMIT_PER_HOUR = 5;

export const BOOKING_PATIENT_KIND = {
  NEW: "NEW",
  RETURNING: "RETURNING",
} as const;

export type BookingPatientKindValue =
  (typeof BOOKING_PATIENT_KIND)[keyof typeof BOOKING_PATIENT_KIND];

export const BOOKING_REQUEST_ERRORS = {
  pendingExists:
    "You already have a pending appointment request. Please wait for the clinic to respond, or call us if you need to make a change.",
  rateLimited:
    "Too many requests. Please try again later or call the clinic.",
  returningNotFound:
    "We could not find a patient record with that email. If this is your first visit, choose First-time patient, or call the clinic.",
  newPatientEmailExists:
    "We already have a patient record with this email. Choose Returning patient and enter your email only, or call the clinic if you need help.",
} as const;

export const CLINIC_PUBLIC = {
  name: "Oak Bay Family Chiropractic Centre",
  website: "https://oakbaychiro.ca",
  phone: "(403) 251-0002",
  phoneTel: "4032510002",
  email: "info@oakbaychiro.ca",
  address: "2515 90 Ave SW, Suite 151, Calgary, AB T2V 0L8",
} as const;
