"use client";

/**
 * Single appointment block in the scheduler grid; colors follow status tokens.
 */

import { getSchedulerCellClasses } from "@/lib/ui/appointmentStatusStyles";

export default function Appointment({
  appointment,
  active,
  setActive,
  showPractitioner = false,
}) {
  const manageActive = (item) => {
    if (active?.id === item.id) {
      setActive(null);
    } else {
      setActive(item);
    }
  };

  const cellClass = getSchedulerCellClasses(appointment.status);

  return (
    <div
      onClick={() => {
        if (appointment === active) return;
        manageActive(appointment);
      }}
      className={`${cellClass} flex h-full w-full cursor-pointer flex-col gap-0.5 overflow-hidden rounded-lg p-1.5 text-left text-ellipsis hover:opacity-90`}
    >
      <p className="truncate text-sm font-semibold">{appointment.name}</p>
      <p className="text-xs font-medium opacity-90">{appointment.time}</p>
      {showPractitioner ? (
        <p className="truncate text-xs font-medium opacity-90">
          {appointment.practitioner}
        </p>
      ) : null}
      <p className="truncate text-xs font-medium opacity-90">{appointment.type}</p>
    </div>
  );
}
