/**
 * Zod schemas for appointment API validation.
 */

import { AppointmentStatus } from "@prisma/client";
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
    status: z.nativeEnum(AppointmentStatus).optional(),
    type: z.enum(ALLOWED_APPOINTMENT_TYPES).optional(),
    providerId: z.coerce.number().int().positive().nullable().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    adminNotes: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    { message: "endTime must be after startTime", path: ["endTime"] },
  );

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type PatchAppointmentInput = z.infer<typeof patchAppointmentSchema>;

/** Re-export for callers that validate status strings manually. */
export { ALLOWED_APPOINTMENT_STATUSES };
