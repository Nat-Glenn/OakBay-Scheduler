/**
 * POST /api/appointments/send-reminders — sends email reminders for upcoming appointments.
 */

import { ok, serverError } from "@/lib/api";
import { sendUpcomingAppointmentReminders } from "@/lib/appointments/reminders";
import { withAuthSimple } from "@/lib/withAuth";

export const POST = withAuthSimple(async () => {
  try {
    const result = await sendUpcomingAppointmentReminders();
    return ok(result);
  } catch (error) {
    console.error("Failed to send reminders:", error);
    return serverError("Failed to send reminders");
  }
});
