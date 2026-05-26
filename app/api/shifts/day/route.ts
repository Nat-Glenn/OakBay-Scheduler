/**
 * Shifts for a single clinic calendar day.
 */

import { withAuthSimple } from "@/lib/withAuth";
import { badRequest, serverError } from "@/lib/api";
import { shiftDayQuerySchema } from "@/lib/shifts/schemas";
import { getShiftsForClinicDay } from "@/lib/shifts/availability";
import { serializeShift } from "@/lib/shifts/serialize";

export const GET = withAuthSimple(async (req) => {
  try {
    const date = new URL(req.url).searchParams.get("date");
    const parsed = shiftDayQuerySchema.safeParse({ date });
    if (!parsed.success) {
      return badRequest("Query param date (YYYY-MM-DD) is required.");
    }

    const shifts = await getShiftsForClinicDay(parsed.data.date);
    return Response.json(shifts.map(serializeShift));
  } catch (err) {
    console.error(err);
    return serverError("Failed to load shifts for day");
  }
});
