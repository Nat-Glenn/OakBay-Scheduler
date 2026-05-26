/**
 * Zod schemas for provider shift API validation.
 */

import { z } from "zod";
import {
  isClinicOpenOnDate,
  isShiftWithinOfficeHours,
} from "@/lib/clinic/officeHours.js";
import { SHIFT_CLOCK_PATTERN } from "./constants";

const clinicDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const clinicClock = z
  .string()
  .regex(SHIFT_CLOCK_PATTERN, "time must be HH:MM (24h)");

export const setProviderDaySchema = z
  .object({
    date: clinicDate,
    providerId: z.coerce.number().int().positive(),
    working: z.boolean(),
    startClock: clinicClock.optional(),
    endClock: clinicClock.optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.working) return true;
      if (!isClinicOpenOnDate(data.date)) {
        return false;
      }
      const start = data.startClock;
      const end = data.endClock;
      if (!start || !end) return false;
      return end > start && isShiftWithinOfficeHours(data.date, start, end);
    },
    {
      message:
        "Shift must be on an open clinic day and within office hours",
      path: ["endClock"],
    },
  );

export const shiftRangeQuerySchema = z.object({
  from: clinicDate,
  to: clinicDate,
});

export const shiftDayQuerySchema = z.object({
  date: clinicDate,
});
