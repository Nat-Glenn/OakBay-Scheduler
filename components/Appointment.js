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
      className={`${cellClass} flex h-full min-h-[3.25rem] w-full cursor-pointer flex-col justify-center gap-0.5 overflow-hidden rounded-md border border-black/10 p-1.5 text-left shadow-sm dark:border-white/10 [&_p]:text-inherit`}
    >
      <p className="truncate text-sm font-semibold leading-tight">
        {appointment.name}
      </p>
      <p className="truncate text-xs font-medium leading-tight">
        {appointment.time}
      </p>
      {showPractitioner ? (
        <p className="truncate text-xs font-medium leading-tight">
          {appointment.practitioner}
        </p>
      ) : null}
      <p className="truncate text-xs font-medium leading-tight">
        {appointment.type}
      </p>
    </div>
  );
}
