/**
 * Zod schemas for provider shift API validation.
 */

import { z } from "zod";
import {
  DEFAULT_SHIFT_END_CLOCK,
  DEFAULT_SHIFT_START_CLOCK,
  SHIFT_CLOCK_PATTERN,
} from "./constants";

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
      const start = data.startClock ?? DEFAULT_SHIFT_START_CLOCK;
      const end = data.endClock ?? DEFAULT_SHIFT_END_CLOCK;
      return end > start;
    },
    { message: "end time must be after start time", path: ["endClock"] },
  );

export const shiftRangeQuerySchema = z.object({
  from: clinicDate,
  to: clinicDate,
});

export const shiftDayQuerySchema = z.object({
  date: clinicDate,
});
