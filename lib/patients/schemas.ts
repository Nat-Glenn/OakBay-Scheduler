/**
 * Zod schemas for patient create/update API validation.
 */

import { z } from "zod";
import {
  optionalEmailSchema,
  optionalTrimmedString,
  patientDobSchema,
  personNameSchema,
  phoneSchema,
} from "@/lib/validation/fields";

export const createPatientSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  ahcNumber: optionalTrimmedString,
  dob: patientDobSchema,
  notes: z.string().max(2000).nullable().optional(),
  reminderOptIn: z.boolean().optional().default(true),
});

export const patchPatientSchema = z
  .object({
    firstName: personNameSchema.optional(),
    lastName: personNameSchema.optional(),
    phone: phoneSchema.optional(),
    email: optionalEmailSchema,
    ahcNumber: optionalTrimmedString,
    dob: patientDobSchema,
    notes: z.string().max(2000).nullable().optional(),
    reminderOptIn: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type PatchPatientInput = z.infer<typeof patchPatientSchema>;
