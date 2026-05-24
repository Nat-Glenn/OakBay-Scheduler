/**
 * Chiropractors currently on shift (clinic time).
 */

import { withAuthSimple } from "@/lib/withAuth";
import { serverError } from "@/lib/api";
import { getProvidersInOffice } from "@/lib/shifts/availability";
import { serializeShift } from "@/lib/shifts/serialize";

export const GET = withAuthSimple(async () => {
  try {
    const inOffice = await getProvidersInOffice();
    return Response.json(inOffice.map(serializeShift));
  } catch (err) {
    console.error(err);
    return serverError("Failed to load in-office providers");
  }
});
