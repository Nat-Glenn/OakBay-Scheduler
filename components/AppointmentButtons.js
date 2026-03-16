"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Item, ItemContent } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { isSameDay } from "date-fns";
import { parseDMYToDate } from "@/components/RenderAppointment";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AppointmentButtons({
  appointment,
  active,
  setAppointments,
  setActive,
}) {
  const selectedAppointment = appointment || active;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [appointmentTotal, setAppointmentTotal] = useState("");
  const [paymentType, setPaymentType] = useState("");

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

    setCheckoutOpen(true);
    return true;
  };

  const handleConfirmCheckout = () => {
    if (!selectedAppointment) return false;

    if (!appointmentTotal || Number(appointmentTotal) <= 0) {
      toast.warning("Please enter a valid appointment total.", {
        position: "top-center",
      });
      return false;
    }

    if (!paymentType) {
      toast.warning("Please select a payment type.", {
        position: "top-center",
      });
      return false;
    }

    updateAppointmentStatus("Checked-out", {
      appointmentTotal,
      paymentType,
    });

    setCheckoutOpen(false);
    setAppointmentTotal("");
    setPaymentType("");

    toast.success("Appointmnet checked out.", {
      position: "top-center",
    });

    return true;
  };

  return (
    <>
      <Item>
        <ItemContent>
          {selectedAppointment.status == "scheduled" && (
            <Button
              onClick={handleCheckIn}
              className="w-full bg-button-primary hover:bg-button-primary-foreground text-center font-semibold text-white"
            >
              Check In
            </Button>
          )}
          {selectedAppointment.status == "checked-in" && (
            <Button
              onClick={handleCheckOut}
              className="w-full bg-destructive hover:bg-destructive/60 text-center font-semibold text-white"
            >
              Check Out
            </Button>
          )}
        </ItemContent>
      </Item>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-6 py-4">
              <div className="flex items-center gap-4 rounded-xl border px-4 py-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Appointment total
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={appointmentTotal}
                  onChange={(e) => setAppointmentTotal(e.target.value)}
                  placeholder="00.00"
                  className="border-0 shadow-none focus-visible:ring-0 text-right"
                />
              </div>

              <div className="rounded-xl border px-4 py-3">
                <span className="mb-2 block text-sm text-muted-foreground">
                  Card type
                </span>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="border-0 px-4 shadow-none focus:ring-0">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleConfirmCheckout}
                className="bg-button-primary text-white"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
  );
}
