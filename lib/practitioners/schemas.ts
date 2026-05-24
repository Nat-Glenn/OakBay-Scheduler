/**
 * Zod schemas for practitioner create/update API validation.
 */

import { z } from "zod";
import {
  emailSchema,
  optionalPhoneOrEmptySchema,
  personNameSchema,
} from "@/lib/validation/fields";

export const createPractitionerSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneOrEmptySchema,
});

export const patchPractitionerSchema = z
  .object({
    name: personNameSchema.optional(),
    email: emailSchema.optional(),
    phone: optionalPhoneOrEmptySchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreatePractitionerInput = z.infer<typeof createPractitionerSchema>;
export type PatchPractitionerInput = z.infer<typeof patchPractitionerSchema>;
