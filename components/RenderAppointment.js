"use client";
import Appointment from "@/components/Appointment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AppointmentButtons from "@/components/AppointmentButtons";
import AppointmentInformation from "@/components/AppointmentInformation";
import { formatPickerDateDMY } from "@/lib/appointments/clinicTime.js";
import { ALL_STAFF } from "@/lib/appointments/status";

export function getAvailableSlot(appointments, date, time, practitioner) {
  const usedSlots = appointments
    .filter(
      (a) =>
        a.date === date && a.time === time && a.practitioner === practitioner,
    )
    .map((a) => a.slot);

  const allSlots = [1, 2, 3, 4];

  return allSlots.find((slot) => !usedSlots.includes(slot)) || null;
}

export function formatDateDMY(date) {
  return formatPickerDateDMY(date);
}

export function parseDMYToDate(dmy) {
  const [day, month, year] = dmy.split("/");
  return new Date(year, month - 1, day);
}

export function renderAppointment(
  hours,
  slotNumber,
  practitioner,
  date,
  active,
  setActive,
  appointments,
  setAppointments,
  small,
) {
  const selectedDate = formatDateDMY(date);

  let appointment;

  if (practitioner === ALL_STAFF) {
    const atTime = appointments
      .filter(
        (a) =>
          a.time === hours &&
          a.date === selectedDate &&
          a.status !== "cancelled",
      )
      .sort(
        (a, b) =>
          a.slot - b.slot || a.practitioner.localeCompare(b.practitioner),
      );
    appointment = atTime[slotNumber - 1];
  } else {
    appointment = appointments.find(
      (a) =>
        a.time === hours &&
        a.slot === slotNumber &&
        a.practitioner === practitioner &&
        a.date === selectedDate,
    );
  }

  return (
    <div className="col-span-2 border border-foreground/20 bg-background text-center p-0.5">
      {appointment ? (
        <Popover>
          <PopoverTrigger className="w-full">
            <Appointment
              appointment={appointment}
              active={active}
              setActive={setActive}
              showPractitioner={practitioner === ALL_STAFF}
            />
          </PopoverTrigger>
          <PopoverContent
            side={small ? "bottom" : "left"}
            className="w-75"
            align="center"
          >
            <AppointmentInformation
              appointment={appointment}
              active={active}
              setActive={setActive}
              appointments={appointments}
              setAppointments={setAppointments}
            />
            {appointment.status != "checked-out" && (
              <AppointmentButtons
                appointment={appointment}
                active={active}
                setAppointments={setAppointments}
                setActive={setActive}
              />
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <div className="h-full">&nbsp;</div>
      )}
    </div>
  );
}
