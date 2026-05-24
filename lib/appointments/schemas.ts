/**
 * Zod schemas for appointment API validation.
 * Used by route handlers; can be mirrored on the client later.
 */

import { z } from "zod";
import {
  ALLOWED_APPOINTMENT_STATUSES,
  ALLOWED_APPOINTMENT_TYPES,
} from "./constants";

export const createAppointmentSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  type: z.enum(ALLOWED_APPOINTMENT_TYPES),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  providerId: z.coerce.number().int().positive().nullable().optional(),
  createdByUserId: z.coerce.number().int().positive().nullable().optional(),
  requestMessage: z.string().max(500).nullable().optional(),
  adminNotes: z.string().max(500).nullable().optional(),
});

export const patchAppointmentSchema = z
  .object({
    status: z.enum(ALLOWED_APPOINTMENT_STATUSES).optional(),
    type: z.enum(ALLOWED_APPOINTMENT_TYPES).optional(),
    providerId: z.coerce.number().int().positive().nullable().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    adminNotes: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type PatchAppointmentInput = z.infer<typeof patchAppointmentSchema>;
