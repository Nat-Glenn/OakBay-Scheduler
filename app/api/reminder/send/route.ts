/**
 * Legacy reminder endpoint — delegates to shared reminder job.
 * Prefer POST /api/appointments/send-reminders.
 */

import { ok, serverError } from "@/lib/api";
import { sendUpcomingAppointmentReminders } from "@/lib/appointments/reminders";
import { withAuthSimple } from "@/lib/withAuth";

export const POST = withAuthSimple(async () => {
  try {
    const result = await sendUpcomingAppointmentReminders();
    return ok(result);
  } catch (err) {
    console.error(err);
    return serverError("Failed to send reminders");
  }
});
