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

  return `${String(hour).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function formatDateOnlyIso(value) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatClinicDateIso(value) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
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

/** Parse YYYY-MM-DD as a clinic calendar date. */
export function parseClinicDateParam(value) {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** UTC instant for a clinic calendar date + HH:mm clock. */
export function clinicClockToUtc(parts, clock) {
  const [hour, minute] = clock.split(":").map(Number);
  const offsetMs = getClinicUtcOffsetMs(new Date());
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0) +
      offsetMs,
  );
}
