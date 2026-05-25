/**
 * Client helpers for staff schedule month grid and bookability checks.
 */

import { formatClinicClockTime } from "@/lib/appointments/clinicTime.js";

export function getMonthBounds(viewDate) {
  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const month = monthIndex + 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  return { from, to, year, month, daysInMonth };
}

export function shiftMapKey(providerId, dateIso) {
  return `${providerId}-${dateIso}`;
}

export function buildShiftLookup(shifts) {
  const map = new Map();
  for (const shift of shifts) {
    map.set(shiftMapKey(shift.providerId, shift.date), shift);
  }
  return map;
}

/** Names of chiropractors with a shift covering the grid time on that day. */
export function getWorkingProviderNamesForSlot(shifts, dateIso, clockTime) {
  const names = new Set();
  for (const shift of shifts) {
    if (shift.date !== dateIso) continue;
    if (clockTime >= shift.startClock && clockTime < shift.endClock) {
      names.add(shift.provider.name);
    }
  }
  return names;
}

export function isProviderWorkingOnDay(shiftLookup, providerId, dateIso) {
  return shiftLookup.has(shiftMapKey(providerId, dateIso));
}

export function formatShiftRange(shift) {
  if (!shift) return "";
  return `${shift.startClock} – ${shift.endClock}`;
}

function clockToMinutes(clock) {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

/** Human-readable shift length for tooltips. */
export function formatShiftDuration(startClock, endClock) {
  const minutes = clockToMinutes(endClock) - clockToMinutes(startClock);
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours} hr ${mins} min`;
  if (hours) return `${hours} hr`;
  return `${mins} min`;
}

/** Native tooltip text for a staff-schedule cell. */
export function formatShiftHoverTitle(shift, providerName, dateLabel) {
  if (!shift) {
    return `${providerName} — ${dateLabel}: Not scheduled`;
  }
  const duration = formatShiftDuration(shift.startClock, shift.endClock);
  const range = formatShiftRange(shift);
  return `${providerName} — ${dateLabel}: In office ${range}${duration ? ` (${duration})` : ""}`;
}

export function getShiftForProvider(dayShifts, providerId) {
  return dayShifts.find((s) => s.providerId === providerId) ?? null;
}

/**
 * Practitioner rows for booking dropdowns (on shift vs off, with hints).
 */
export function buildPractitionerDropdownItems({
  practitioners,
  dayShifts,
  scheduleEnforced,
  dateIso,
  clockTime = null,
  search = "",
  unavailableProviderIds = [],
}) {
  const query = search.trim().toLowerCase();
  const unavailable = new Set(unavailableProviderIds);
  const workingAtTime =
    scheduleEnforced && clockTime
      ? getWorkingProviderNamesForSlot(dayShifts, dateIso, clockTime)
      : null;

  const items = practitioners
    .filter((p) => {
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        String(p.id).includes(query)
      );
    })
    .map((p) => {
      const shift = getShiftForProvider(dayShifts, p.id);
      const booked = unavailable.has(p.id);
      let onShift = true;
      let meta = null;
      let disabled = booked;

      if (booked) {
        meta = "Already booked at this time";
      } else if (scheduleEnforced) {
        if (clockTime && workingAtTime) {
          onShift = workingAtTime.has(p.name);
          meta = onShift
            ? `On shift at ${clockTime} · ${formatShiftRange(shift)}`
            : shift
              ? `Off at ${clockTime} · scheduled ${formatShiftRange(shift)}`
              : "Not scheduled today";
        } else {
          onShift = Boolean(shift);
          meta = shift
            ? `Scheduled ${formatShiftRange(shift)}`
            : "Not scheduled today";
        }
        disabled = disabled || !onShift;
      }

      return {
        id: p.id,
        name: p.name,
        disabled,
        booked,
        onShift: scheduleEnforced && !booked ? onShift : null,
        meta,
      };
    });

  return items.sort((a, b) => {
    if (a.disabled === b.disabled) {
      return a.name.localeCompare(b.name);
    }
    return a.disabled ? 1 : -1;
  });
}

export function formatInOfficeLabel(shift) {
  return `${shift.provider.name} (${formatShiftRange(shift)})`;
}

/** Compare appointment grid time to shift clocks (HH:MM strings). */
export function isClockWithinShift(clockTime, shift) {
  if (!shift) return false;
  return clockTime >= shift.startClock && clockTime < shift.endClock;
}

export function formatShiftUpdatedAt(iso) {
  if (!iso) return "";
  return formatClinicClockTime(iso);
}
