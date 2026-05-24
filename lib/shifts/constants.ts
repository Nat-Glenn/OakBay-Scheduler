/**
 * Default chiropractor shift hours (clinic local clock).
 * Matches scheduler slots: morning through late afternoon with lunch gap in booking grid only.
 */

export const DEFAULT_SHIFT_START_CLOCK = "09:00";
export const DEFAULT_SHIFT_END_CLOCK = "17:45";

export const SHIFT_CLOCK_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
