"use client";

import React, { useEffect, useMemo, useState } from "react";
import NavBarComp from "@/components/NavBarComp";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  User,
  ListFilter,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/utils/UseMediaQuery";

export default function SummaryHistoryPage() {
  const small = useMediaQuery("(max-width: 768px)");

  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/summary/history", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load history");

        const data = await res.json();
        setHistoryData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load history:", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const sortLabels = {
    patient: "Patient Name",
    date: "Date",
    type: "Type",
    status: "Status",
  };

  const filteredHistory = useMemo(() => {
    const search = tableSearch.toLowerCase();

    let items = historyData.filter((visit) => {
      const patient = String(visit.patient || "").toLowerCase();
      const type = String(visit.type || "").toLowerCase();
      const status = String(visit.status || "").toLowerCase();
      const paymentMethod = String(visit.paymentMethod || "").toLowerCase();

      return (
        patient.includes(search) ||
        type.includes(search) ||
        status.includes(search) ||
        paymentMethod.includes(search)
      );
    });

    items.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [historyData, tableSearch, sortConfig]);

  function formatVisitDate(dateValue) {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatVisitTime(dateValue) {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  }

  function normalizeStatus(status) {
    if (!status) return "Pending";
    const lower = String(status).toLowerCase();

    if (lower === "checked-out" || lower === "checked_out" || lower === "completed" || lower === "complete")
      return "Completed";
    if (lower === "checked-in" || lower === "checked_in")
      return "In Progress";
    if (lower === "confirmed")
      return "Confirmed";
    if (lower === "cancelled" || lower === "canceled")
      return "Cancelled";
    if (lower === "requested")
      return "Requested";

    return String(status)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (loading) {
    return (
      <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
        <NavBarComp />
        <div className="flex flex-col min-w-0 px-4 pb-4">
          {!small && <header className="py-4"><h1 className="text-3xl font-bold">Visit History</h1></header>}
          <div className="p-6">Loading history...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
        <NavBarComp />
        <div className="flex flex-col min-w-0 px-4 pb-4">
          {!small && <header className="py-4"><h1 className="text-3xl font-bold">Visit History</h1></header>}
          <div className="p-6 text-red-500">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 px-4 pb-4 overflow-hidden flex-1">

        {/* Page Header */}
        <header className="flex flex-row py-4 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/Summary">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            {!small && <h1 className="text-3xl font-bold">Visit History</h1>}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-2xl justify-end">
            <InputGroup className="bg-input border-border max-w-md">
              <InputGroupInput
                placeholder="Search..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
              <InputGroupAddon>
                <Search size={18} />
              </InputGroupAddon>
            </InputGroup>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 items-center border-border font-semibold h-11">
                  <ListFilter size={18} />
                  {!small && `Sort: ${sortLabels[sortConfig.key]}`}
                  <ChevronDown size={16} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort By Column</DropdownMenuLabel>
                {Object.entries(sortLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSortConfig({ ...sortConfig, key })}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    {label}
                    {sortConfig.key === key && <Check size={16} className="text-button-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortConfig({ ...sortConfig, direction: "asc" })}
                  className="flex justify-between items-center cursor-pointer"
                >
                  Ascending
                  {sortConfig.direction === "asc" && <Check size={16} className="text-button-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortConfig({ ...sortConfig, direction: "desc" })}
                  className="flex justify-between items-center cursor-pointer"
                >
                  Descending
                  {sortConfig.direction === "desc" && <Check size={16} className="text-button-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Data Table */}
        <div className="rounded-xl border border-border bg-dropdown flex flex-1 flex-col min-h-0 overflow-hidden shadow-sm">
          <div className="min-h-0 overflow-y-auto scrollbar-rounded flex-1">
            <Table className="border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">Patient</TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">Date & Time</TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">Type</TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground text-center">Status</TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">Payment</TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((visit) => (
                    <TableRow key={visit.id} className="border-border/50 hover:bg-border/30">
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted-foreground" />
                          {visit.patient}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium flex items-center gap-1 text-foreground">
                            <Calendar size={12} className="text-button-primary" />
                            {formatVisitDate(visit.date)}
                          </span>
                          {formatVisitTime(visit.date) && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock size={12} /> {formatVisitTime(visit.date)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{visit.type || "—"}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm py-1.5 rounded-full font-semibold inline-flex items-center justify-center w-24 ${
                            normalizeStatus(visit.status) === "Completed"
                              ? "bg-[#a0ce66] text-primary"
                              : normalizeStatus(visit.status) === "Confirmed"
                                ? "bg-blue-500 text-white"
                                : normalizeStatus(visit.status) === "Cancelled"
                                  ? "bg-red-100 text-red-600"
                                  : normalizeStatus(visit.status) === "In Progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : normalizeStatus(visit.status) === "Requested"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-yellow-100 text-red-600"
                          }`}
                        >
                          {normalizeStatus(visit.status)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{visit.paymentMethod || "—"}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(visit.amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No visit history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
}