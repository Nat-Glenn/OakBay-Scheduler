/**
 * Approve a pending booking request and create a scheduled appointment.
 */

import { withAuth } from "@/lib/withAuth";
import { badRequest, notFound, serverError } from "@/lib/api";
import { parseBody } from "@/lib/validation/parseBody";
import { approveBookingRequestSchema } from "@/lib/booking-requests/schemas";
import { approveBookingRequest } from "@/lib/booking-requests/service";
import { serializeBookingRequest } from "@/lib/booking-requests/serialize";

export const POST = withAuth(async (req, context, user) => {
  try {
    const { id: idStr } = await context.params;
    const requestId = Number(idStr);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return badRequest("Invalid request id");
    }

    const body = await req.json();
    const parsed = parseBody(approveBookingRequestSchema, body);
    if (!parsed.ok) return parsed.response;

    const result = await approveBookingRequest({
      requestId,
      preferenceId: parsed.data.preferenceId,
      providerId: parsed.data.providerId,
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      reviewedByUserId: user.dbUserId,
    });

    if (!result.ok) {
      if (result.status === 404) return notFound(result.error);
      return badRequest(result.error);
    }

    return Response.json({
      request: serializeBookingRequest(result.request),
      appointment: result.appointment,
    });
  } catch (err) {
    console.error(err);
    return serverError("Failed to approve request");
  }
});
