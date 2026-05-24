/**
 * Client-safe clinic timezone helpers (mirrors lib/appointments/clinicTime.ts).
 */

export const CLINIC_TIMEZONE = "America/Edmonton";

export function formatClinicClockTime(value) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  return `${hour}:${minute.padStart(2, "0")}`;
}

export function formatClinicDateDMY(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    timeZone: CLINIC_TIMEZONE,
  });
}

export function formatPickerDateDMY(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const offsetMs = getClinicUtcOffsetMs(new Date());
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + offsetMs);
  return formatClinicDateDMY(start);
}

function getClinicUtcOffsetMs(at = new Date()) {
  const utcMs = new Date(at.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const clinicMs = new Date(
    at.toLocaleString("en-US", { timeZone: CLINIC_TIMEZONE }),
  ).getTime();
  return utcMs - clinicMs;
}

export function formatPickerDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
