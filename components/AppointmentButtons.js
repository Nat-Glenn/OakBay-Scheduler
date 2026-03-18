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

  const handleCheckIn = async () => {
    if (!selectedAppointment) return false;

    if (selectedAppointment.status !== "scheduled") {
      toast.warning("You can only check in appointments that are scheduled.", {
        position: "top-center",
      });
      return false;
    }

    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CHECKED_IN",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in appointment");
      }

      updateAppointmentStatus("checked-in");

      toast.success("Appointment checked in.", {
        position: "top-center",
      });

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to check in appointment.", {
        position: "top-center",
      });
      return false;
    }
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

  const handleConfirmCheckout = async () => {
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

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          amount: Number(appointmentTotal),
          paymentType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      updateAppointmentStatus("checked-out", {
        appointmentTotal: Number(appointmentTotal),
        paymentType,
      });

      setCheckoutOpen(false);
      setAppointmentTotal("");
      setPaymentType("");

      toast.success("Appointment checked out.", {
        position: "top-center",
      });

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to record payment.", {
        position: "top-center",
      });
      return false;
    }
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
          <div className="flex flex-row px-4">
            <div className="grid grid-rows-2 items-center">
              <span className="text-sm text-foreground whitespace-nowrap">
                Appointment total
              </span>
              <span className="text-sm text-foreground">Card type</span>
            </div>
            <div className="grid grid-rows-2 w-full">
              <div className="flex items-center gap-4 px-4 py-3 cols-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={appointmentTotal}
                  onChange={(e) => setAppointmentTotal(e.target.value)}
                  placeholder="00.00"
                  className="shadow-none focus-visible:ring-0 text-left"
                />
              </div>
              <div className="flex items-center gap-4 px-4 py-3">
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="shadow-none focus:ring-0 w-full">
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
