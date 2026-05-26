/**
 * Zod schemas for public booking requests and staff review actions.
 */

import { z } from "zod";
import {
  emailSchema,
  personNameSchema,
  phoneSchema,
} from "@/lib/validation/fields";
import { ALLOWED_APPOINTMENT_TYPES } from "@/lib/appointments/constants";
import { BOOKING_PATIENT_KIND, MAX_BOOKING_PREFERENCES } from "./constants";
import { isClockWithinOfficeHours, isClinicOpenOnDate } from "@/lib/clinic/officeHours.js";

const clinicDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const clinicClock = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "time must be HH:MM");

const preferenceSchema = z.object({
  date: clinicDate,
  clock: clinicClock,
});

const bookingPreferenceFields = {
  type: z.enum(ALLOWED_APPOINTMENT_TYPES),
  message: z.string().max(500).nullable().optional(),
  preferredProviderName: z.string().max(100).nullable().optional(),
  preferences: z
    .array(preferenceSchema)
    .min(1, "Select at least one preferred time")
    .max(MAX_BOOKING_PREFERENCES),
  /** Honeypot — must be empty when provided. */
  website: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === "", "Invalid submission"),
};

function refineBookingPreferences(
  data: { preferences: Array<{ date: string; clock: string }> },
  ctx: z.RefinementCtx,
) {
  for (let i = 0; i < data.preferences.length; i++) {
    const pref = data.preferences[i];
    if (!isClinicOpenOnDate(pref.date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Clinic is closed on this date",
        path: ["preferences", i, "date"],
      });
      continue;
    }
    if (!isClockWithinOfficeHours(pref.date, pref.clock)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time is outside office hours",
        path: ["preferences", i, "clock"],
      });
    }
  }
}

const newPatientBookingSchema = z
  .object({
    patientKind: z.literal(BOOKING_PATIENT_KIND.NEW),
    firstName: personNameSchema,
    lastName: personNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    ...bookingPreferenceFields,
  })
  .superRefine(refineBookingPreferences);

const returningPatientBookingSchema = z
  .object({
    patientKind: z.literal(BOOKING_PATIENT_KIND.RETURNING),
    email: emailSchema,
    ...bookingPreferenceFields,
  })
  .superRefine(refineBookingPreferences);

export const createBookingRequestSchema = z.discriminatedUnion("patientKind", [
  newPatientBookingSchema,
  returningPatientBookingSchema,
]);

export const approveBookingRequestSchema = z.object({
  preferenceId: z.coerce.number().int().positive(),
  providerId: z.coerce.number().int().positive(),
  status: z.enum(["CONFIRMED", "REQUESTED"]).optional().default("CONFIRMED"),
  adminNotes: z.string().max(500).nullable().optional(),
});

export const declineBookingRequestSchema = z.object({
  declineReason: z.string().max(500).nullable().optional(),
});

export type CreateBookingRequestInput = z.infer<
  typeof createBookingRequestSchema
>;
