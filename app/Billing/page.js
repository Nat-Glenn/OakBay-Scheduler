"use client";

import React, { useMemo, useState } from "react";
import NavBarComp from "@/components/NavBarComp";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Printer, PencilLine, Plus, Search, X } from "lucide-react";

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

function maskCard(num) {
  const digits = String(num || "").replace(/\D/g, "");
  const last4 = digits.slice(-4) || "••••";
  return `•••• •••• •••• ${last4}`;
}

export default function Billing() {
  const [cards, setCards] = useState([
    { id: "card_1", brand: "Visa", last4: "5679", exp: "01/29" },
  ]);

  const [brand, setBrand] = useState("Visa");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReprintOpen, setIsReprintOpen] = useState(false);
  const [reprintQuery, setReprintQuery] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  // Manage form fields
  const [manageBrand, setManageBrand] = useState("Visa");
  const [manageLast4, setManageLast4] = useState("");
  const [manageExp, setManageExp] = useState("");
  const small = useMediaQuery("(max-width: 768px)");
  const handleReprint = (appt) => {
    // TODO: replace with your receipt logic (route to receipt page, open print window, fetch PDF, etc.)
    console.log("Reprinting receipt for:", appt);

    // close modal after click (optional)
    setIsReprintOpen(false);
  };
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  const handleAddCard = () => {
    const digits = number.replace(/\D/g, "");
    const last4 = digits.slice(-4);

    if (!brand || !last4 || !exp) return;

    setCards((prev) => [
      ...prev,
      {
        id: `card_${Date.now()}`,
        brand,
        last4,
        exp,
      },
    ]);

    // reset + close
    setBrand("Visa");
    setNumber("");
    setExp("");
    setIsAddOpen(false);
  };

  const openManageCard = (card) => {
    setSelectedCardId(card.id);
    setManageBrand(card.brand || "Visa");
    setManageLast4(card.last4 || "");
    setManageExp(card.exp || "");
    setIsManageOpen(true);
  };

  const handleSaveManagedCard = () => {
    if (!selectedCardId) return;

    const cleanLast4 = manageLast4.replace(/\D/g, "").slice(-4);
    if (!manageBrand || cleanLast4.length !== 4 || !manageExp) return;

    setCards((prev) =>
      prev.map((c) =>
        c.id === selectedCardId
          ? { ...c, brand: manageBrand, last4: cleanLast4, exp: manageExp }
          : c,
      ),
    );

    setIsManageOpen(false);
  };

  const handleDeleteManagedCard = () => {
    if (!selectedCardId) return;

    setCards((prev) => prev.filter((c) => c.id !== selectedCardId));

    setIsManageOpen(false);
  };

  return (
    <main className="flex flex-col min-h-dvh w-full">
      <NavBarComp />

      {/* Manage Card Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DHeader>
            <DTitle>Manage Card</DTitle>
            <DialogDescription>
              Edit this card or remove it from the patient file.
            </DialogDescription>
          </DHeader>

          <div className="mt-2 rounded-2xl border border-foreground bg-card p-4 space-y-4">
            <div className="space-y-2">
              <Label>Card Type</Label>
              <Select value={manageBrand} onValueChange={setManageBrand}>
                <SelectTrigger className="bg-input text-foreground border-foreground">
                  <SelectValue placeholder="Card Type" />
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
              <Label htmlFor="manageLast4">Card Number (Last 4)</Label>
              <Input
                id="manageLast4"
                value={manageLast4}
                onChange={(e) =>
                  setManageLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                placeholder="1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manageExp">Expiry</Label>
              <Input
                id="manageExp"
                value={manageExp}
                onChange={(e) => setManageExp(e.target.value)}
                placeholder="MM/YY"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
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

      <div className="flex flex-col min-h-0 overflow-hidden px-4 pb-4">
        {/* Header */}
        <header className="flex flex-row gap-4 items-center py-4">
          {!small && (
            <div className="w-full flex flex-col">
              <h1 className="text-3xl font-bold text-foreground">Billing</h1>
            </div>
          )}
          {/* Buttons */}
          <div
            className={`flex w-full flex-row ${small ? "" : "justify-end gap-4"}`}
          >
            <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
              <DialogTrigger asChild>
                <Button variant="third" className={`${small ? "text-xs" : ""}`}>
                  <PencilLine size={18} />
                  Billing Adjustment
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[900px]">
                <DHeader>
                  <DTitle>Billing Adjustment</DTitle>
                  <DialogDescription>
                    Select an appointment to edit or delete
                  </DialogDescription>
                </DHeader>

                <div className="mt-2 rounded-2xl border border-foreground bg-card p-4 space-y-4">
                  <div className="text-sm font-medium text-foreground">
                    Appointments
                  </div>
                  <div className="h-[320px] rounded-xl border border-foreground bg-background" />
                </div>

                <DialogFooter className="justify-between">
                  <Button variant="outline">Edit</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isReprintOpen} onOpenChange={setIsReprintOpen}>
              <DialogTrigger asChild>
                <Button variant="third" className={`${small ? "text-xs" : ""}`}>
                  <Printer size={18} />
                  Re-Print Receipt
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[900px]">
                <DHeader>
                  <DTitle>Receipt Reprint</DTitle>
                  <DialogDescription>
                    Select an appointment to reprint
                  </DialogDescription>
                </DHeader>

                {/* List container */}
                <div className="mt-2 rounded-2xl border border-foreground bg-card p-4">
                  <div className="text-sm font-medium text-foreground mb-3">
                    Recent Appointments
                  </div>

                  <div className="h-[320px] rounded-xl border border-foreground bg-background" />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={18} />
                  {small ? "" : "New Card"}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[480px]">
                <DHeader>
                  <DTitle>Add card to patient file</DTitle>
                  <DialogDescription>This is a placeholder</DialogDescription>
                </DHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Card Type</Label>
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger className="bg-input text-foreground border-foreground">
                        <SelectValue placeholder="Card Type" />
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
                    <Label htmlFor="number">Card Number</Label>
                    <Input
                      id="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      inputMode="numeric"
                      placeholder="•••• •••• •••• 1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp">Expiry</Label>
                    <Input
                      id="exp"
                      value={exp}
                      onChange={(e) => setExp(e.target.value)}
                      placeholder="MM/YY"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCard}>Save card</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="flex-1 min-h-0 pb-8 overflow-y-auto scrollbar-rounded space-y-6">
          <Separator className="bg-border" />

          {/* Cards on File */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cards on File
              </h2>
              <p className="text-sm text-foreground">
                Saved payment methods for patient
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((c) => (
                <Card key={c.id} className="border-foreground bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CreditCard className="size-4 text-muted-foreground" />
                        {c.brand}
                      </span>
                      <Badge variant="outline">On file</Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div className="font-mono text-sm text-foreground">
                      {maskCard(c.last4)}
                    </div>
                    <div className="text-sm text-foreground">Exp: {c.exp}</div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openManageCard(c)}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {cards.length === 0 && (
                <Card className="border-foreground bg-card">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No cards on file for this patient.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
