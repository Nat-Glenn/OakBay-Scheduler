/**
 * Client helpers for loading public booking availability on /book.
 */

import { formatPickerDateForApi } from "@/lib/appointments/clinicTime.js";

export function parseApiDateToPickerDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function fetchBookableDates() {
  const res = await fetch("/api/booking-requests/availability");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to load available dates");
  }
  return Array.isArray(data.dates) ? data.dates : [];
}

export async function fetchBookableSlotsForDate(dateIso) {
  const res = await fetch(
    `/api/booking-requests/availability?date=${encodeURIComponent(dateIso)}`,
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to load available times");
  }
  return Array.isArray(data.slots) ? data.slots : [];
}

export function isDateBookable(date, bookableDateSet) {
  if (!date || !bookableDateSet?.size) return false;
  return bookableDateSet.has(formatPickerDateForApi(date));
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
