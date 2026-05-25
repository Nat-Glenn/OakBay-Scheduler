/**
 * Default chiropractor shift hours (clinic local clock) when day-specific hours unavailable.
 * Prefer getDefaultShiftClocksForDate() from lib/clinic/officeHours.js.
 */

export const DEFAULT_SHIFT_START_CLOCK = "07:00";
export const DEFAULT_SHIFT_END_CLOCK = "18:00";

export const SHIFT_CLOCK_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
