/**
 * Zod schemas for clinic team (User) create/update via /api/team.
 */

import { ClinicRole } from "@prisma/client";
import { z } from "zod";
import {
  emailSchema,
  optionalPhoneOrEmptySchema,
  personNameSchema,
} from "@/lib/validation/fields";

export const teamRoleSchema = z.enum([
  ClinicRole.Chiropractor,
  ClinicRole.Receptionist,
]);

export const createTeamMemberSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneOrEmptySchema,
  role: teamRoleSchema,
});

export const patchTeamMemberSchema = z
  .object({
    name: personNameSchema.optional(),
    email: emailSchema.optional(),
    phone: optionalPhoneOrEmptySchema,
    role: teamRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type PatchTeamMemberInput = z.infer<typeof patchTeamMemberSchema>;
