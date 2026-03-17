"use client";

import React, { useEffect, useMemo, useState } from "react";
import NavBarComp from "@/components/NavBarComp";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, PencilLine, Plus, Search, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader as DHeader,
  DialogTitle as DTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/utils/UseMediaQuery";

function maskCard(last4) {
  const digits = String(last4 || "").replace(/\D/g, "").slice(-4) || "••••";
  return `•••• •••• •••• ${digits}`;
}

function parseExpiry(value) {
  const raw = String(value || "").trim();
  if (!raw.includes("/")) return { expMonth: null, expYear: null };

  const [monthStr, yearStr] = raw.split("/");
  const expMonth = Number(monthStr);
  let expYear = Number(yearStr);

  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
    return { expMonth: null, expYear: null };
  }

  if (!Number.isInteger(expYear)) {
    return { expMonth: null, expYear: null };
  }

  if (expYear < 100) {
    expYear += 2000;
  }

  return { expMonth, expYear };
}

function formatExpiry(expMonth, expYear) {
  if (!expMonth || !expYear) return "—";
  const mm = String(expMonth).padStart(2, "0");
  const yy = String(expYear).slice(-2);
  return `${mm}/${yy}`;
}

export default function Billing() {
  const small = useMediaQuery("(max-width: 768px)");

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const [brand, setBrand] = useState("Visa");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");

  const [selectedCard, setSelectedCard] = useState(null);
  const [manageBrand, setManageBrand] = useState("Visa");
  const [manageLast4, setManageLast4] = useState("");
  const [manageExp, setManageExp] = useState("");

  const selectedPatientName = useMemo(() => {
    if (!selectedPatient) return "";
    return `${selectedPatient.firstName} ${selectedPatient.lastName}`;
  }, [selectedPatient]);

  useEffect(() => {
    let ignore = false;

    async function loadPatients() {
      if (!patientSearch.trim()) {
        setPatientResults([]);
        return;
      }

      try {
        setLoadingPatients(true);
        const res = await fetch(
          `/api/patients?search=${encodeURIComponent(patientSearch)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load patients");
        }

        if (!ignore) {
          setPatientResults(data);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setPatientResults([]);
      } finally {
        if (!ignore) setLoadingPatients(false);
      }
    }

    loadPatients();

    return () => {
      ignore = true;
    };
  }, [patientSearch]);

  useEffect(() => {
    let ignore = false;

    async function loadCards() {
      if (!selectedPatient?.id) {
        setCards([]);
        return;
      }

      try {
        setLoadingCards(true);
        const res = await fetch(`/api/cards?patientId=${selectedPatient.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load cards");
        }

        if (!ignore) {
          setCards(data);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setCards([]);
      } finally {
        if (!ignore) setLoadingCards(false);
      }
    }

    loadCards();

    return () => {
      ignore = true;
    };
  }, [selectedPatient]);

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setPatientResults([]);
  }

  async function handleAddCard() {
    if (!selectedPatient?.id) return;

    const digits = number.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    const { expMonth, expYear } = parseExpiry(exp);

    if (!brand || last4.length !== 4) {
      alert("Please enter a valid card brand and number.");
      return;
    }

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          brand,
          last4,
          expMonth,
          expYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save card");
      }

      setCards((prev) => [data, ...prev]);
      setBrand("Visa");
      setNumber("");
      setExp("");
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save card");
    }
  }

  function openManageCard(card) {
    setSelectedCard(card);
    setManageBrand(card.brand || "Visa");
    setManageLast4(card.last4 || "");
    setManageExp(formatExpiry(card.expMonth, card.expYear));
    setIsManageOpen(true);
  }

  async function handleSaveManagedCard() {
    if (!selectedCard?.id) return;

    const cleanLast4 = manageLast4.replace(/\D/g, "").slice(-4);
    const { expMonth, expYear } = parseExpiry(manageExp);

    if (!manageBrand || cleanLast4.length !== 4) {
      alert("Please enter valid card details.");
      return;
    }

    try {
      const res = await fetch("/api/cards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedCard.id,
          brand: manageBrand,
          last4: cleanLast4,
          expMonth,
          expYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update card");
      }

      setCards((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      setIsManageOpen(false);
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update card");
    }
  }

  async function handleDeleteManagedCard() {
    if (!selectedCard?.id) return;

    try {
      const res = await fetch(`/api/cards?id=${selectedCard.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete card");
      }

      setCards((prev) => prev.filter((c) => c.id !== selectedCard.id));
      setIsManageOpen(false);
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete card");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBarComp />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {!small && <h1 className="mb-6 text-3xl font-semibold">Billing</h1>}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <UiCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Patient
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name or phone"
                  className="pl-9"
                />
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {loadingPatients ? (
                  <p className="text-sm text-muted-foreground">
                    Loading patients...
                  </p>
                ) : patientSearch.trim() === "" ? (
                  <p className="text-sm text-muted-foreground">
                    Start typing to search for a patient.
                  </p>
                ) : patientResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No patients found
                  </p>
                ) : (
                  patientResults.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full rounded-lg border p-3 text-left transition hover:bg-muted"
                    >
                      <div className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {patient.phone}
                      </div>
                      {patient.email && (
                        <div className="text-sm text-muted-foreground">
                          {patient.email}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </UiCard>

          <div className="space-y-6">
            <UiCard>
              <CardHeader>
                <CardTitle>Patient</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      {selectedPatientName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Phone: {selectedPatient.phone}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Email: {selectedPatient.email || "—"}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Search for a patient to load their billing profile.
                  </p>
                )}
              </CardContent>
            </UiCard>

            <UiCard>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Cards on File
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Saved cards for the selected patient
                  </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedPatient}>
                      <Plus className="mr-2 h-4 w-4" />
                      {small ? "" : "New Card"}
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DHeader>
                      <DTitle>Add card to patient file</DTitle>
                      <DialogDescription>
                        {selectedPatient
                          ? `Adding a card for ${selectedPatientName}`
                          : "Select a patient first"}
                      </DialogDescription>
                    </DHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Card Type</Label>
                        <Select value={brand} onValueChange={setBrand}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visa">Visa</SelectItem>
                            <SelectItem value="Mastercard">Mastercard</SelectItem>
                            <SelectItem value="Amex">Amex</SelectItem>
                            <SelectItem value="Debit">Debit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          inputMode="numeric"
                          placeholder="•••• •••• •••• 1234"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expiry</Label>
                        <Input
                          value={exp}
                          onChange={(e) => setExp(e.target.value)}
                          placeholder="MM/YY"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddCard} disabled={!selectedPatient}>
                        Save card
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent className="space-y-3">
                {!selectedPatient ? (
                  <p className="text-sm text-muted-foreground">
                    Select a patient to view their saved cards.
                  </p>
                ) : loadingCards ? (
                  <p className="text-sm text-muted-foreground">
                    Loading cards...
                  </p>
                ) : cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No cards on file for this patient.
                  </p>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div>
                        <div className="font-medium">{card.brand}</div>
                        <div className="text-sm text-muted-foreground">
                          {maskCard(card.last4)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Exp: {formatExpiry(card.expMonth, card.expYear)}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => openManageCard(card)}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </UiCard>
          </div>
        </div>
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent>
          <DHeader>
            <DTitle>Manage Card</DTitle>
            <DialogDescription>
              Edit this card or remove it from the patient file.
            </DialogDescription>
          </DHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Card Type</Label>
              <Select value={manageBrand} onValueChange={setManageBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="Amex">Amex</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Card Number (Last 4)</Label>
              <Input
                value={manageLast4}
                onChange={(e) =>
                  setManageLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                placeholder="1234"
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry</Label>
              <Input
                value={manageExp}
                onChange={(e) => setManageExp(e.target.value)}
                placeholder="MM/YY"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button variant="destructive" onClick={handleDeleteManagedCard}>
              Delete card
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsManageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveManagedCard}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}