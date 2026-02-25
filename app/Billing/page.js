"use client"

import React, { useMemo, useState } from "react";
import NavBarComp from "@/components/NavBarComp";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { CreditCard, Printer, PencilLine, Plus } from "lucide-react";

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
  DialogHeader,
} from "@/components/ui/dialog";
;

function maskCard(num) {
  const digits = String(num || "").replace(/\D/g, "");
  const last4 = digits.slice(-4) || "••••";
  return `•••• •••• •••• ${last4}`;
}

export default function Billing(){

    const [cards, setCards] = useState([
        { id: "card_1", brand: "Visa", last4: "5679", exp: "01/29" },
    ]);

    // Add Card dialog state
    const [brand, setBrand] = useState("Visa");
    const [number, setNumber] = useState("");
    const [exp, setExp] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isReprintOpen, setIsReprintOpen] = useState(false);
    const [reprintQuery, setReprintQuery] = useState("");
    const handleReprint = (appt) => {
        // TODO: replace with your receipt logic (route to receipt page, open print window, fetch PDF, etc.)
        console.log("Reprinting receipt for:", appt);

        // close modal after click (optional)
        setIsReprintOpen(false);
    };

    const cardsForUI = useMemo(
        () =>
            cards.map((c) => ({
                ...c,
                displayNumber: maskCard(c.last4 ? `000000000000${c.last4}` : number),
            })),
        [cards],
    );

    const handleAddCard = () => {
        const digits = number.replace(/\D/g, "");
        const last4 = digits.slice(-4);

        if (!last4 || !exp) return;

        setCards((prev) => [
        ...prev,
        {
            id: `card_${Date.now()}`,
            brand: brand || "Card",
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

    return(
        <main className="flex min-h-dvh w-full">
            <NavBarComp/>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header */}
                <header className="p-8 pb-4">
                    <h1 className="text-3xl font-bold text-foreground">Billing</h1>
                </header>

                <div className="flex-1 min-h-0 px-8 pb-8 overflow-y-auto no-scrollbar space-y-6">
                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="gap-2">
                            <PencilLine className="size-4" />
                            Billing Adjustment
                        </Button>

                        <Dialog open={isReprintOpen} onOpenChange={setIsReprintOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Printer className="size-4" />
                                    Re-Print Receipt
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-[900px]">
                                <DHeader>
                                    <DTitle>Receipt Reprint</DTitle>
                                    <DialogDescription>Select an appointment to reprint</DialogDescription>
                                </DHeader>

                                {/* List container */}
                                <div className="mt-2 rounded-2xl border border-border bg-card p-4">
                                    <div className="text-sm font-medium text-foreground mb-3">
                                        Recent Appointments
                                    </div>

                                    <div className="h-[320px] rounded-xl border border-border bg-background" />
                                </div>
                                
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="size-4" />
                                    Add Card
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-[480px]">
                                <DHeader>
                                    <DTitle>Add card to patient file</DTitle>
                                    <DialogDescription>
                                        This is a placeholder
                                    </DialogDescription>
                                </DHeader>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Card Type</Label>
                                        <Select value={brand} onValueChange={setBrand}>
                                            <SelectTrigger className="bg-input text-foreground border-border">
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

                    <Separator className="bg-border" />

                    {/* Cards on File */}
                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Cards on File
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Saved payment methods for patient
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cardsForUI.map((c) => (
                                <Card key={c.id} className="border-border bg-card">
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
                                        <div className="text-sm text-muted-foreground">
                                            Exp: {c.exp}
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <Button variant="ghost" size="sm" disabled>
                                                Manage
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {cardsForUI.length === 0 && (
                                <Card className="border-border bg-card">
                                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                        No cards on file yet. Click <span className="text-foreground font-medium">Add Card</span>.
                                    </CardContent>
                                </Card>
                            )}

                            
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}