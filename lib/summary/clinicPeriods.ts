/**
 * Clinic-calendar period bounds (America/Edmonton) for summary revenue and counts.
 */

import {
  CLINIC_TIMEZONE,
  getClinicDayBounds,
  type ClinicDateParts,
} from "@/lib/appointments/clinicTime";

export function getClinicTodayParts(at: Date = new Date()): ClinicDateParts {
  const calgaryDateStr = at.toLocaleDateString("en-CA", {
    timeZone: CLINIC_TIMEZONE,
  });
  const [year, month, day] = calgaryDateStr.split("-").map(Number);
  return { year, month, day };
}

function getClinicWeekdayIndex(parts: ClinicDateParts): number {
  const { start } = getClinicDayBounds(parts);
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "short",
  }).format(start);
  const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return order.indexOf(short);
}

function addClinicDays(parts: ClinicDateParts, deltaDays: number): ClinicDateParts {
  const { start } = getClinicDayBounds(parts);
  const next = new Date(start.getTime() + deltaDays * 86_400_000);
  return getClinicTodayParts(next);
}

/** Today 00:00–23:59:59.999 in clinic timezone (UTC instants for Prisma). */
export function getClinicTodayBounds(at: Date = new Date()) {
  return getClinicDayBounds(getClinicTodayParts(at));
}

/** Monday 00:00 through end of today (clinic week-to-date). */
export function getClinicWeekToDateBounds(at: Date = new Date()) {
  const today = getClinicTodayParts(at);
  const dow = getClinicWeekdayIndex(today);
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = addClinicDays(today, -daysFromMonday);
  return {
    start: getClinicDayBounds(monday).start,
    end: getClinicDayBounds(today).end,
  };
}

/** Prior full clinic week (Monday–Sunday immediately before current week). */
export function getClinicPriorWeekBounds(at: Date = new Date()) {
  const today = getClinicTodayParts(at);
  const dow = getClinicWeekdayIndex(today);
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const thisMonday = addClinicDays(today, -daysFromMonday);
  const priorMonday = addClinicDays(thisMonday, -7);
  const priorSunday = addClinicDays(thisMonday, -1);
  return {
    start: getClinicDayBounds(priorMonday).start,
    end: getClinicDayBounds(priorSunday).end,
  };
}

/** Current calendar month in clinic timezone (1st 00:00 → last moment of month). */
export function getClinicMonthBounds(at: Date = new Date()) {
  const today = getClinicTodayParts(at);
  const start = getClinicDayBounds({
    year: today.year,
    month: today.month,
    day: 1,
  }).start;

  const nextMonth =
    today.month === 12
      ? { year: today.year + 1, month: 1, day: 1 }
      : { year: today.year, month: today.month + 1, day: 1 };
  const nextStart = getClinicDayBounds(nextMonth).start;
  const end = new Date(nextStart.getTime() - 1);

  return { start, end };
}

/** Current calendar year in clinic timezone. */
export function getClinicYearBounds(at: Date = new Date()) {
  const today = getClinicTodayParts(at);
  const start = getClinicDayBounds({
    year: today.year,
    month: 1,
    day: 1,
  }).start;
  const nextYearStart = getClinicDayBounds({
    year: today.year + 1,
    month: 1,
    day: 1,
  }).start;
  const end = new Date(nextYearStart.getTime() - 1);
  return { start, end };
}
