"use client";
import Appointment from "@/components/Appointment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AppointmentButtons from "@/components/AppointmentButtons";
import AppointmentInformation from "@/components/AppointmentInformation";

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
  return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
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
) {
  const selectedDate = formatDateDMY(date);
  const appointment = appointments.find(
    (a) =>
      a.time === hours &&
      a.slot === slotNumber &&
      a.practitioner === practitioner &&
      a.date === selectedDate,
  );

  return (
    <div className="col-span-2 border border-border bg-background p-1 text-center">
      {appointment ? (
        <Popover>
          <PopoverTrigger className="w-full">
            <Appointment
              appointment={appointment}
              active={active}
              setActive={setActive}
            />
          </PopoverTrigger>
          <PopoverContent className="w-75" align="center">
            <AppointmentInformation
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
