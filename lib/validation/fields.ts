/**
 * Reusable Zod field schemas aligned with lib/validate.ts regex rules.
 * Used by patient and practitioner API validation.
 */

import { z } from "zod";
import { emailRegex, nameRegex, phoneRegex } from "@/lib/validate";

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(50, "Name cannot exceed 50 characters")
  .regex(
    nameRegex,
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  );

export const phoneSchema = z
  .string()
  .trim()
  .regex(phoneRegex, "Invalid phone number format");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email cannot exceed 254 characters")
  .regex(emailRegex, "Invalid email format");

export const optionalEmailSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? null
      : String(value).trim().toLowerCase(),
  z
    .string()
    .max(254, "Email cannot exceed 254 characters")
    .regex(emailRegex, "Invalid email format")
    .nullable()
    .optional(),
);

export const optionalTrimmedString = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? null
      : String(value).trim(),
  z.string().nullable().optional(),
);

export const patientDobSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? null
      : String(value).trim(),
  z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const dobDate = new Date(value);
        if (Number.isNaN(dobDate.getTime())) return false;
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return dobDate <= oneYearAgo;
      },
      { message: "Date of birth must be at least 1 year ago" },
    ),
);

export const optionalPhoneOrEmptySchema = z
  .union([z.literal(""), phoneSchema])
  .optional();
