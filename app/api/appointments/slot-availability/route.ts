/**
 * Staff GET — how many appointments occupy a start time and which providers are unavailable.
 */

import { withAuthSimple } from "@/lib/withAuth";
import { badRequest, serverError } from "@/lib/api";
import { getSlotAvailabilitySummary } from "@/lib/appointments/clinicSlots";
import { APPOINTMENT_SLOT_MINUTES } from "@/lib/booking-requests/constants";

export const GET = withAuthSimple(async (req) => {
  try {
    const startTimeParam = new URL(req.url).searchParams.get("startTime");
    if (!startTimeParam) {
      return badRequest("startTime query param is required");
    }

    const startTime = new Date(startTimeParam);
    if (Number.isNaN(startTime.getTime())) {
      return badRequest("Invalid startTime");
    }

    const endTime = new Date(startTime);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + APPOINTMENT_SLOT_MINUTES);

    const summary = await getSlotAvailabilitySummary(startTime, endTime);
    return Response.json(summary);
  } catch (err) {
    console.error(err);
    return serverError("Failed to load slot availability");
  }
});
