/**
 * Throttles global appointment status sync so list/read APIs stay fast.
 */

import { syncOverdueAppointmentStatuses } from "@/lib/appointments/lifecycle";

const DEFAULT_INTERVAL_MS = 60_000;

let lastSyncAt = 0;
let syncInFlight: Promise<void> | null = null;

/** Runs sync at most once per interval (shared across concurrent requests). */
export async function syncOverdueAppointmentStatusesThrottled(
  intervalMs = DEFAULT_INTERVAL_MS,
): Promise<void> {
  const now = Date.now();
  if (now - lastSyncAt < intervalMs) {
    return;
  }

  if (syncInFlight) {
    await syncInFlight;
    return;
  }

  syncInFlight = (async () => {
    try {
      await syncOverdueAppointmentStatuses();
      lastSyncAt = Date.now();
    } finally {
      syncInFlight = null;
    }
  })();

  await syncInFlight;
}
