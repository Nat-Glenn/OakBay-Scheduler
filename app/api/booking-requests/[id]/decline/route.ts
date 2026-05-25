/**
 * Decline a pending booking request.
 */

import { withAuth } from "@/lib/withAuth";
import { badRequest, notFound, serverError } from "@/lib/api";
import { parseBody } from "@/lib/validation/parseBody";
import { declineBookingRequestSchema } from "@/lib/booking-requests/schemas";
import { declineBookingRequest } from "@/lib/booking-requests/service";
import { serializeBookingRequest } from "@/lib/booking-requests/serialize";

export const POST = withAuth(async (req, context, user) => {
  try {
    const { id: idStr } = await context.params;
    const requestId = Number(idStr);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return badRequest("Invalid request id");
    }

    const body = await req.json();
    const parsed = parseBody(declineBookingRequestSchema, body);
    if (!parsed.ok) return parsed.response;

    const result = await declineBookingRequest({
      requestId,
      declineReason: parsed.data.declineReason,
      reviewedByUserId: user.dbUserId,
    });

    if (!result.ok) {
      if (result.status === 404) return notFound(result.error);
      return badRequest(result.error);
    }

    return Response.json(serializeBookingRequest(result.request));
  } catch (err) {
    console.error(err);
    return serverError("Failed to decline request");
  }
});
