/**
 * Public GET — bookable dates and time slots for /book (staff schedule + capacity).
 */

import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api";
import {
  getPublicBookableDatesBetween,
  getPublicBookableSlotsForDay,
  getPublicBookingAvailabilityRange,
} from "@/lib/booking-requests/availability";
import { parseClinicDateParam } from "@/lib/appointments/clinicTime";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (date) {
    if (!parseClinicDateParam(date)) {
      return badRequest("date must be YYYY-MM-DD");
    }

    const slots = await getPublicBookableSlotsForDay(date);
    return NextResponse.json({ date, slots });
  }

  const defaults = getPublicBookingAvailabilityRange();
  const from = fromParam ?? defaults.from;
  const to = toParam ?? defaults.to;

  if (!parseClinicDateParam(from) || !parseClinicDateParam(to)) {
    return badRequest("from and to must be YYYY-MM-DD");
  }

  const dates = await getPublicBookableDatesBetween(from, to);
  return NextResponse.json({ from, to, dates });
}
