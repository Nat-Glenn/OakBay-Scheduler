/**
 * Billing & cards — payment history, cards on file, and patient search.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Eye,
  EyeOff,
  History,
  PencilLine,
  Plus,
  Search,
  User,
  Users,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  CARD_BRAND_OPTIONS,
  isCardExpired,
  paymentTypeLabel,
} from "@/lib/billing/constants";
import { unwrapApiList } from "@/lib/billing/apiData";
import { formatCurrencyDisplay } from "@/lib/formatting/currency";
import EmptyState from "@/components/EmptyState";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormField from "@/components/FormField";
import PageHeader from "@/components/PageHeader";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import { toast } from "sonner";

function maskCard(last4) {
  const digits =
    String(last4 || "")
      .replace(/\D/g, "")
      .slice(-4) || "••••";
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
  const searchParams = useSearchParams();

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

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
  const [showManageLast4, setShowManageLast4] = useState(false);

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
        const res = await apiFetch(
          `/api/patients?search=${encodeURIComponent(patientSearch)}`,
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
        const res = await apiFetch(`/api/cards?patientId=${selectedPatient.id}`);
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

  useEffect(() => {
    if (!selectedPatient?.id) {
      setPayments([]);
      return;
    }

    let ignore = false;

    async function loadPayments() {
      try {
        setLoadingPayments(true);
        const res = await apiFetch(
          `/api/patients/${selectedPatient.id}/payments`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseApiError(data, "Failed to load payment history"));
        }
        if (!ignore) {
          setPayments(unwrapApiList(data));
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setPayments([]);
      } finally {
        if (!ignore) setLoadingPayments(false);
      }
    }

    loadPayments();
    return () => {
      ignore = true;
    };
  }, [selectedPatient?.id]);

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setPatientResults([]);
  }

  const openPatientById = useCallback(async (patientId) => {
    try {
      const res = await apiFetch(`/api/patients/${patientId}`);
      const data = await res.json();
      if (!res.ok) return;
      const patient = data?.data ?? data;
      if (patient?.id) {
        handleSelectPatient(patient);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const param = searchParams.get("patientId");
    if (!param || selectedPatient) return;
    const id = Number(param);
    if (!Number.isInteger(id) || id <= 0) return;
    openPatientById(id);
  }, [searchParams, openPatientById, selectedPatient]);

  async function handleAddCard() {
    if (!selectedPatient?.id) return;

    const digits = number.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    const { expMonth, expYear } = parseExpiry(exp);

    if (!brand || last4.length !== 4) {
      toast.error("Please enter a valid card brand and number.");
      return;
    }

    try {
      const res = await apiFetch("/api/cards", {
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
      toast.success("Card saved.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save card");
    }
  }

  function openManageCard(card) {
    setSelectedCard(card);
    setManageBrand(card.brand || "Visa");
    setManageLast4(card.last4 || "");
    setManageExp(formatExpiry(card.expMonth, card.expYear));
    setShowManageLast4(false);
    setIsManageOpen(true);
  }

  async function handleSaveManagedCard() {
    if (!selectedCard?.id) return;

    const cleanLast4 = manageLast4.replace(/\D/g, "").slice(-4);
    const { expMonth, expYear } = parseExpiry(manageExp);

    if (!manageBrand || cleanLast4.length !== 4) {
      toast.error("Please enter valid card details.");
      return;
    }

    try {
      const res = await apiFetch("/api/cards", {
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
      toast.success("Card updated.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update card");
    }
  }

  async function handleDeleteManagedCard() {
    if (!selectedCard?.id) return;

    try {
      const res = await apiFetch(`/api/cards?id=${selectedCard.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete card");
      }

      setCards((prev) => prev.filter((c) => c.id !== selectedCard.id));
      setIsManageOpen(false);
      setSelectedCard(null);
      toast.success("Card removed.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete card");
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <PageHeader
          title="Billing & cards"
          description="Payment history and cards on file for each patient"
        />
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card>
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
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-lg border bg-muted/40"
                      />
                    ))}
                  </div>
                ) : patientSearch.trim() === "" ? (
                  <EmptyState
                    icon={Search}
                    title="Search for a patient"
                    description="Type a name, phone number, or patient ID to find someone."
                  />
                ) : patientResults.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No patients found"
                    description="Try a different spelling or search by phone."
                  />
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
          </Card>

          <div className="space-y-4">
            <Card>
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
                  <EmptyState
                    icon={User}
                    title="Select a patient"
                    description="Search and choose a patient to view their billing profile."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Payment history
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Completed checkouts for this patient
                </p>
              </CardHeader>
              <CardContent>
                {!selectedPatient ? (
                  <p className="text-sm text-muted-foreground">
                    Select a patient to view payments.
                  </p>
                ) : loadingPayments ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No payments recorded yet.
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {payments.map((payment) => {
                      const appt = payment.appointment;
                      const when = appt?.startTime
                        ? new Date(appt.startTime).toLocaleString("en-CA", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : new Date(payment.createdAt).toLocaleString("en-CA");
                      return (
                        <li
                          key={payment.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-border/80 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">
                              {formatCurrencyDisplay(payment.amount)}
                            </p>
                            <p className="text-muted-foreground">
                              {paymentTypeLabel(payment.paymentType)}
                              {appt?.type ? ` · ${appt.type}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {when}
                              {appt?.provider?.name
                                ? ` · ${appt.provider.name}`
                                : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Cards on file
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
                    <DialogHeader>
                      <DialogTitle>Add card to patient file</DialogTitle>
                      <DialogDescription>
                        {selectedPatient
                          ? `Adding a card for ${selectedPatientName}`
                          : "Select a patient first"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Card Type</Label>
                        <Select value={brand} onValueChange={setBrand}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CARD_BRAND_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <FormField
                          fieldLabel="Card Number"
                          placeholder="•••• •••• •••• 1234"
                          variant="add"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          mask="card"
                          secret
                        />
                      </div>

                      <div className="space-y-2">
                        <FormField
                          fieldLabel="Expiry"
                          placeholder="MM/YY"
                          variant="add"
                          value={exp}
                          onChange={(e) => setExp(e.target.value)}
                          maxLength={16}
                          mask="exp"
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
                      <Button
                        onClick={handleAddCard}
                        disabled={!selectedPatient}
                      >
                        Save card
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent className="space-y-3">
                {!selectedPatient ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No patient selected"
                    description="Choose a patient to view or add cards on file."
                  />
                ) : loadingCards ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-xl border bg-muted/40"
                      />
                    ))}
                  </div>
                ) : cards.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No cards on file"
                    description="Add a payment card for this patient using New Card."
                  />
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{card.brand}</span>
                          {isCardExpired(card.expMonth, card.expYear) ? (
                            <Badge variant="outline" className="text-[10px]">
                              Expired
                            </Badge>
                          ) : null}
                        </div>
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
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Card</DialogTitle>
            <DialogDescription>
              Edit this card or remove it from the patient file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Card Type</Label>
              <Select value={manageBrand} onValueChange={setManageBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  {CARD_BRAND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Card Number (Last 4)</Label>
              <InputGroup className="border-foreground bg-background">
                <InputGroupInput
                  value={manageLast4}
                  onChange={(e) =>
                    setManageLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  type={showManageLast4 ? "text" : "password"}
                  inputMode="numeric"
                  placeholder="1234"
                  autoComplete="off"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    aria-label={
                      showManageLast4
                        ? "Hide last four digits"
                        : "Show last four digits"
                    }
                    onClick={() => setShowManageLast4((v) => !v)}
                  >
                    {showManageLast4 ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
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
    </>
  );
}
