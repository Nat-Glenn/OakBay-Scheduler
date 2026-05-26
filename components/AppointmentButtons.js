/**
 * Check-in and checkout actions for a scheduler appointment.
 * Checkout records payment and supports cards on file when available.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormField from "./FormField";
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";
import { unwrapApiList } from "@/lib/billing/apiData";
import {
  PAYMENT_METHOD_OPTIONS,
  paymentTypeFromCardBrand,
  paymentTypeLabel,
  isCardExpired,
} from "@/lib/billing/constants";
import { parseCurrencyAmount } from "@/lib/formatting/currency";

function maskCardLast4(last4) {
  const digits =
    String(last4 || "")
      .replace(/\D/g, "")
      .slice(-4) || "••••";
  return `•••• ${digits}`;
}

function buildCheckoutPaymentOptions(cards) {
  const options = [];

  for (const card of cards) {
    if (isCardExpired(card.expMonth, card.expYear)) continue;
    const paymentType = paymentTypeFromCardBrand(card.brand);
    options.push({
      value: `card:${card.id}`,
      label: `${card.brand} ${maskCardLast4(card.last4)} (on file)`,
      paymentType,
    });
  }

  for (const method of PAYMENT_METHOD_OPTIONS) {
    options.push({
      value: `method:${method.value}`,
      label: method.label,
      paymentType: method.value,
    });
  }

  return options;
}

export default function AppointmentButtons({
  appointment,
  active,
  setAppointments,
  setActive,
}) {
  const selectedAppointment = appointment || active;
  const [appointmentTotal, setAppointmentTotal] = useState("");
  const [paymentSelection, setPaymentSelection] = useState("");
  const [cardsOnFile, setCardsOnFile] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const checkoutOptions = useMemo(
    () => buildCheckoutPaymentOptions(cardsOnFile),
    [cardsOnFile],
  );

  const selectedPaymentOption = useMemo(
    () => checkoutOptions.find((o) => o.value === paymentSelection),
    [checkoutOptions, paymentSelection],
  );

  useEffect(() => {
    if (!selectedAppointment?.patientId) {
      setCardsOnFile([]);
      setPaymentSelection("");
      return;
    }

    let ignore = false;

    async function loadCards() {
      try {
        setLoadingCards(true);
        const res = await apiFetch(
          `/api/cards?patientId=${selectedAppointment.patientId}`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseApiError(data, "Failed to load cards on file"));
        }
        if (!ignore) {
          setCardsOnFile(unwrapApiList(data));
        }
      } catch {
        if (!ignore) setCardsOnFile([]);
      } finally {
        if (!ignore) setLoadingCards(false);
      }
    }

    loadCards();
    return () => {
      ignore = true;
    };
  }, [selectedAppointment?.patientId]);

  useEffect(() => {
    if (paymentSelection) return;
    const cash = checkoutOptions.find((o) => o.value === "method:cash");
    if (cash) setPaymentSelection(cash.value);
  }, [checkoutOptions, paymentSelection]);

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
      const res = await apiFetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_IN" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to check in appointment"));
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

    const amount = parseCurrencyAmount(appointmentTotal);
    if (amount == null) {
      toast.warning("Enter a valid amount greater than zero.", {
        position: "top-right",
      });
      return false;
    }

    if (!selectedPaymentOption) {
      toast.warning("Select a payment method.", {
        position: "top-right",
      });
      return false;
    }

    try {
      const res = await apiFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          amount,
          paymentType: selectedPaymentOption.paymentType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to record payment"));
      }

      updateAppointmentStatus("checked-out");

      setAppointmentTotal("");
      setPaymentSelection("");

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

  const cardsOnFileGroup = checkoutOptions.filter((o) =>
    o.value.startsWith("card:"),
  );
  const otherMethodsGroup = checkoutOptions.filter((o) =>
    o.value.startsWith("method:"),
  );

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
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>
                  Record payment for this visit. Amount is charged in clinic.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <FormField
                  fieldLabel="Amount (CAD)"
                  placeholder="0.00"
                  variant="add"
                  value={appointmentTotal}
                  onChange={(e) => setAppointmentTotal(e.target.value)}
                  mask="currency"
                  inputMode="decimal"
                />
                <div className="space-y-2">
                  <Label>Payment method</Label>
                  <Select
                    value={paymentSelection}
                    onValueChange={setPaymentSelection}
                    disabled={loadingCards && checkoutOptions.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {cardsOnFileGroup.length > 0 ? (
                        <SelectGroup>
                          <SelectLabel>Cards on file</SelectLabel>
                          {cardsOnFileGroup.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ) : null}
                      <SelectGroup>
                        <SelectLabel>
                          {cardsOnFileGroup.length > 0
                            ? "Other methods"
                            : "Payment methods"}
                        </SelectLabel>
                        {otherMethodsGroup.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {loadingCards ? (
                    <p className="text-xs text-muted-foreground">
                      Loading cards on file…
                    </p>
                  ) : null}
                  {selectedPaymentOption ? (
                    <p className="text-xs text-muted-foreground">
                      Recording as{" "}
                      {paymentTypeLabel(selectedPaymentOption.paymentType)}
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleConfirmCheckout}>Confirm checkout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </ItemContent>
    </Item>
  );
}
