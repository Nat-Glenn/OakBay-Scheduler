/**
 * Clinic timezone helpers — Oak Bay operates in Alberta (America/Edmonton).
 * Used for appointment day bounds and scheduler time labels.
 */

export const CLINIC_TIMEZONE = "America/Edmonton";

/** UTC offset for the clinic timezone at a given instant (ms). */
export function getClinicUtcOffsetMs(at: Date = new Date()): number {
  const utcMs = new Date(at.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const clinicMs = new Date(
    at.toLocaleString("en-US", { timeZone: CLINIC_TIMEZONE }),
  ).getTime();
  return utcMs - clinicMs;
}

export type ClinicDateParts = {
  year: number;
  month: number;
  day: number;
};

/** Parse YYYY-MM-DD as a clinic calendar date (not server-local). */
export function parseClinicDateParam(value: string | null): ClinicDateParts | null {
  if (!value?.trim()) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

/** Start/end of a clinic calendar day as UTC instants for Prisma queries. */
export function getClinicDayBounds(parts: ClinicDateParts) {
  const offsetMs = getClinicUtcOffsetMs(new Date());

  const start = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) + offsetMs,
  );
  const end = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999) + offsetMs,
  );

  return { start, end };
}

/** Grid clock label e.g. "9:00" in clinic timezone. */
export function formatClinicClockTime(value: Date | string): string {
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

/**
 * YYYY-MM-DD from a date-only field (ProviderShift.shiftDate).
 * Uses UTC calendar parts — do not apply clinic TZ (avoids off-by-one day).
 */
export function formatDateOnlyIso(value: Date | string): string {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD in clinic timezone (instants, appointments). */
export function formatClinicDateIso(value: Date | string): string {
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

/** dd/mm/yyyy in clinic timezone for grid matching. */
export function formatClinicDateDMY(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    timeZone: CLINIC_TIMEZONE,
  });
}

/** dd/mm/yyyy from the date picker's selected calendar day (clinic calendar). */
export function formatPickerDateDMY(date: Date): string {
  const { start } = getClinicDayBounds({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
  return formatClinicDateDMY(start);
}

/** YYYY-MM-DD for API query from date picker. */
export function formatPickerDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
