"use client";
import { toast } from "sonner";
import { Item, ItemContent } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { isSameDay } from "date-fns";
import { parseDMYToDate } from "@/components/RenderAppointment";

export default function AppointmentButtons({
  appointment,
  active,
  setAppointments,
  setActive,
}) {
  const selectedAppointment = appointment || active;

  const updateAppointmentStatus = (newStatus) => {
    if (!selectedAppointment) return false;

    const updatedAppointment = {
      ...selectedAppointment,
      status: newStatus,
    };

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === selectedAppointment.id ? updatedAppointment : appt,
      ),
    );

    setActive(updatedAppointment);
    return true;
  };

  const isAppointmentToday = (apptDate) => {
    return isSameDay(parseDMYToDate(apptDate), new Date());
  };
  
  const handleCheckIn = () => {
    if (!selectedAppointment) return false;

    if (selectedAppointment.status !== "scheduled") {
      toast.warning(
        "You can only check in appointments that are scheduled.",
        { position: "top-center" },
      );
      return false;
    }

    updateAppointmentStatus("checked-in");

    toast.success("Appointment checked in.", {
      position: "top-center",
    });

    return true;
  };

  const handleCheckOut = () => {
    if (!selectedAppointment) return false;

    if (selectedAppointment.status !== "checked-in") {
      toast.warning(
        "You can only check out appointments that are checked-in.",
        { position: "top-center" },
      );
      return false;
    }

    updateAppointmentStatus("checked-out");

    toast.success("Appointment checked out.", {
      position: "top-center",
    });

    return true;
  };
  
  return (
    <Item>
      <ItemContent>
        {appointment.status == "scheduled" && (
          <Button
            onClick={handleCheckIn}
            className="w-full bg-button-primary hover:bg-button-primary-foreground text-center font-semibold text-white"
          >
            Check In
          </Button>
        )}
        {appointment.status == "checked-in" && (
          <Button
            onClick={handleCheckOut}
            className="w-full bg-destructive hover:bg-destructive/60 text-center font-semibold text-white"
          >
            Check Out
          </Button>
        )}
      </ItemContent>
    </Item>
  );
}
