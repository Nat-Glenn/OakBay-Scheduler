"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Item, ItemContent } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormField from "./FormField";

export default function AppointmentButtons({
  // Props coming into the component
  appointment,
  active,
  setAppointments,
  setActive,
}) {
  // Determines which appt to use
  const selectedAppointment = appointment || active;
  const [appointmentTotal, setAppointmentTotal] = useState("");
  const [paymentType, setPaymentType] = useState("");

  // Updates the front end state after the backend succeeds
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

  // Function that runs when the user clicks check in
  const handleCheckIn = async () => {
    if (!selectedAppointment) return false;

    if (selectedAppointment.status !== "scheduled") {
      toast.warning("You can only check in appointments that are scheduled.", {
        position: "top-right",
      });
      return false;
    }

    if (selectedAppointment.date !== new Date().toLocaleDateString("en-GB")) {
      toast.warning("You can only check in appointments scheduled for today.", {
        position: "top-right",
      });
      return false;
    }

    try {
      // Request to backend
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CHECKED_IN",
        }),
      });

      // Header of application / json lets the request process
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in appointment");
      }

      updateAppointmentStatus("checked-in");

      toast.success("Appointment checked in.", {
        position: "top-right",
      });

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to check in appointment.", {
        position: "top-right",
      });
      return false;
    }
  };

  const handleCheckOut = () => {
    if (!selectedAppointment) return false;

    if (selectedAppointment.status !== "checked-in") {
      toast.warning(
        "You can only check out appointments that are checked-in.",
        { position: "top-right" },
      );
      return false;
    }

    return true;
  };

  const handleConfirmCheckout = async () => {
    if (!selectedAppointment) return false;

    if (!appointmentTotal || Number(appointmentTotal) <= 0) {
      toast.warning("Please enter a valid appointment total.", {
        position: "top-right",
      });
      return false;
    }

    if (!paymentType) {
      toast.warning("Please select a payment type.", {
        position: "top-right",
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

      setAppointmentTotal("");
      setPaymentType("");

      toast.success("Appointment checked out.", {
        position: "top-right",
      });

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to record payment.", {
        position: "top-right",
      });
      return false;
    }
  };

  return (
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
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={handleCheckOut}
                className="w-full bg-destructive hover:bg-destructive/60 text-center font-semibold text-white"
              >
                Check Out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>
                Enter Appointment&apos;s Cost
              </DialogDescription>
              <div className="flex flex-row gap-4">
                <FormField
                  fieldLabel="Total Cost"
                  placeholder="00.00"
                  variant="add"
                  value={appointmentTotal}
                  onChange={(e) => setAppointmentTotal(e.target.value)}
                  maxLength={4}
                />
                <FormField
                  fieldLabel="Card Type"
                  placeholder="Visa"
                  variant="select"
                  itemsArray={[
                    { id: 1, name: "Visa" },
                    { id: 2, name: "Mastercard" },
                    { id: 3, name: "Debit" },
                    { id: 4, name: "Cash" },
                  ]}
                  displayText={paymentType}
                  setItemSearch={setPaymentType}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleConfirmCheckout}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </ItemContent>
    </Item>
  );
}
