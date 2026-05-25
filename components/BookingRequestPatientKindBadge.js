/**
 * New vs returning label for rows from the public /book form.
 */

import { Badge } from "@/components/ui/badge";
import { BOOKING_PATIENT_KIND } from "@/lib/booking-requests/constants";

export default function BookingRequestPatientKindBadge({ patientKind }) {
  const isReturning = patientKind === BOOKING_PATIENT_KIND.RETURNING;

  return (
    <Badge
      variant={isReturning ? "secondary" : "outline"}
      className="text-[10px] font-medium uppercase tracking-wide"
    >
      {isReturning ? "Returning" : "New"}
    </Badge>
  );
}
