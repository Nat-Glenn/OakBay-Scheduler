/**
 * Oak Bay clinic office hours (America/Edmonton).
 * Drives scheduler rows, public /book slots, shift defaults, and validation.
 */

import {
  CLINIC_TIMEZONE,
  clinicClockToUtc,
  parseClinicDateParam,
} from "@/lib/appointments/clinicTime.js";

export const APPOINTMENT_SLOT_MINUTES = 15;

/** 0 = Sunday … 6 = Saturday; null = closed */
const OFFICE_HOURS_BY_WEEKDAY = {
  0: null,
  1: [{ start: "10:00", end: "13:00" }],
  2: [
    { start: "07:00", end: "11:00" },
    { start: "14:00", end: "18:00" },
  ],
  3: [{ start: "10:00", end: "13:00" }],
  4: [
    { start: "09:30", end: "12:30" },
    { start: "14:00", end: "18:00" },
  ],
  5: null,
  6: null,
};

export const OFFICE_HOURS_DISPLAY = [
  "Monday & Wednesday: 10:00 AM – 1:00 PM",
  "Tuesday: 7:00 AM – 11:00 AM, 2:00 PM – 6:00 PM",
  "Thursday: 9:30 AM – 12:30 PM, 2:00 PM – 6:00 PM",
  "Friday – Sunday: Closed",
];

const WEEKDAY_SHORT_TO_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function clockToMinutes(clock) {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToClock(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeClock(clock) {
  const [hourPart, minutePart = "00"] = String(clock).trim().split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function slotsFromRanges(ranges) {
  const slots = [];
  for (const range of ranges) {
    const startM = clockToMinutes(range.start);
    const endM = clockToMinutes(range.end);
    for (
      let m = startM;
      m + APPOINTMENT_SLOT_MINUTES <= endM;
      m += APPOINTMENT_SLOT_MINUTES
    ) {
      slots.push(minutesToClock(m));
    }
  }
  return slots;
}

/** Clinic weekday 0–6 from YYYY-MM-DD. */
export function getClinicWeekdayFromDateParam(dateIso) {
  const parts = parseClinicDateParam(dateIso);
  if (!parts) return null;

  const noon = clinicClockToUtc(parts, "12:00");
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "short",
  }).format(noon);

  return WEEKDAY_SHORT_TO_INDEX[weekday] ?? null;
}

export function getOfficeHourRangesForDate(dateIso) {
  const weekday = getClinicWeekdayFromDateParam(dateIso);
  if (weekday == null) return null;
  return OFFICE_HOURS_BY_WEEKDAY[weekday] ?? null;
}

export function isClinicOpenOnDate(dateIso) {
  const ranges = getOfficeHourRangesForDate(dateIso);
  return Boolean(ranges?.length);
}

/** 15-minute start times available on a given clinic day. */
export function getOfficeTimeSlotsForDate(dateIso) {
  const ranges = getOfficeHourRangesForDate(dateIso);
  if (!ranges) return [];
  return slotsFromRanges(ranges);
}

export function isClockWithinOfficeHours(dateIso, clock) {
  const normalized = normalizeClock(clock);
  return getOfficeTimeSlotsForDate(dateIso).includes(normalized);
}

/** Default shift span for staff schedule (first open – last close). */
export function getDefaultShiftClocksForDate(dateIso) {
  const ranges = getOfficeHourRangesForDate(dateIso);
  if (!ranges?.length) return null;
  return {
    startClock: ranges[0].start,
    endClock: ranges[ranges.length - 1].end,
  };
}

export function isShiftWithinOfficeHours(dateIso, startClock, endClock) {
  const ranges = getOfficeHourRangesForDate(dateIso);
  if (!ranges?.length) return false;

  const startM = clockToMinutes(normalizeClock(startClock));
  const endM = clockToMinutes(normalizeClock(endClock));
  if (endM <= startM) return false;

  const dayOpen = clockToMinutes(ranges[0].start);
  const dayClose = clockToMinutes(ranges[ranges.length - 1].end);
  return startM >= dayOpen && endM <= dayClose;
}

export function formatOfficeHoursForDate(dateIso) {
  const ranges = getOfficeHourRangesForDate(dateIso);
  if (!ranges?.length) return "Closed";

  return ranges
    .map((r) => `${formatClock12h(r.start)} – ${formatClock12h(r.end)}`)
    .join(", ");
}

function formatClock12h(clock) {
  const [h, m] = clock.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${hour12}:00 ${suffix}`
    : `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Union of every bookable grid time (all open days). */
function buildAllOfficeTimeSlots() {
  const seen = new Set();
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const ranges = OFFICE_HOURS_BY_WEEKDAY[weekday];
    if (!ranges) continue;
    for (const slot of slotsFromRanges(ranges)) {
      seen.add(slot);
    }
  }
  return [...seen].sort((a, b) => clockToMinutes(a) - clockToMinutes(b));
}

export const CLINIC_TIME_SLOTS = buildAllOfficeTimeSlots();

export function toFormOptions(items) {
  return items.map((name, index) => ({ id: index + 1, name }));
}

export const CLINIC_TIME_SLOT_OPTIONS = toFormOptions(CLINIC_TIME_SLOTS);
