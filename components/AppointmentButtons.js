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
  const isAppointmentToday = (apptDate) => {
    return isSameDay(parseDMYToDate(apptDate), new Date());
  };
  const handleCheckIn = () => {
    if (!isAppointmentToday(active.date)) {
      toast.warning("You can only check in appointments scheduled for today.", {
        position: "top-center",
      });
      return;
    }

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === active.id ? { ...appt, status: "checked-in" } : appt,
      ),
    );

    setActive({ ...active, status: "checked-in" });
  };

  const handleCheckOut = () => {
    if (active.status != "checked-in") {
      toast.warning(
        "You can only check out appointments that are checked-in.",
        { position: "top-center" },
      );
      return;
    }

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === active.id ? { ...appt, status: "checked-out" } : appt,
      ),
    );

    setActive({ ...active, status: "checked-out" });
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
