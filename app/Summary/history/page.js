"use client";

import React, { useEffect, useMemo, useState } from "react";
import NavBarComp from "@/components/NavBarComp";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/utils/UseMediaQuery";

export default function SummaryHistoryPage() {
  const small = useMediaQuery("(max-width: 768px)");

  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/summary/history", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load history");
        }

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

  const filteredHistory = useMemo(() => {
    const search = tableSearch.toLowerCase();

    return historyData.filter((visit) => {
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
  }, [historyData, tableSearch]);

  function formatVisitDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

    if (
      lower === "checked-out" ||
      lower === "completed" ||
      lower === "complete"
    ) {
      return "Completed";
    }

    if (lower === "checked-in") {
      return "In Progress";
    }

    if (lower === "cancelled" || lower === "canceled") {
      return "Cancelled";
    }

    return String(status)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (loading) {
    return (
      <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
        <NavBarComp />
        <div className="flex flex-col min-w-0 overflow-y-auto px-4 pb-4">
          {!small && (
            <header className="py-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">
                Visit History
              </h1>
            </header>
          )}
          <div className="p-6 text-foreground">Loading history...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
        <NavBarComp />
        <div className="flex flex-col min-w-0 overflow-y-auto px-4 pb-4">
          {!small && (
            <header className="py-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">
                Visit History
              </h1>
            </header>
          )}
          <div className="p-6 text-red-500">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 overflow-y-auto px-4 pb-4">
        {!small && (
          <header className="py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Visit History
              </h1>
              <p className="text-muted-foreground mt-1">
                Full patient visit history from real appointment records
              </p>
            </div>

            <Link href="/Summary">
              <Button variant="secondary" className="gap-2">
                <ArrowLeft size={16} />
                Back to Summary
              </Button>
            </Link>
          </header>
        )}

        <Card className="shadow-sm border-sidebar mt-4">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 px-8 gap-4">
            <CardTitle className="text-xl font-bold">
              All Recorded Visits
            </CardTitle>

            <div className="relative flex-1 md:flex-none w-full md:w-64 border border-sidebar dark:border-foreground rounded-md overflow-hidden">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Search history"
                className="pl-8 bg-muted/50 border-none h-10 text-sm w-full focus-visible:ring-0"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 overflow-x-auto">
            <Table className="text-base min-w-[800px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="py-4 text-primary/50">Patient</TableHead>
                  <TableHead className="py-4 text-primary/50">Date</TableHead>
                  <TableHead className="py-4 text-primary/50">Type</TableHead>
                  <TableHead className="py-4 text-primary/50">Status</TableHead>
                  <TableHead className="py-4 text-primary/50">
                    Payment
                  </TableHead>
                  <TableHead className="py-4 text-primary/50">Amount</TableHead>
                  <TableHead className="py-4 text-primary/50">Notes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((visit) => (
                    <TableRow
                      key={visit.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-bold text-foreground py-5">
                        {visit.patient}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-5">
                        {formatVisitDate(visit.date)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-5">
                        {visit.type || "—"}
                      </TableCell>
                      <TableCell className="py-5">
                        <StatusBadge status={normalizeStatus(visit.status)} />
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-5">
                        {visit.paymentMethod || "—"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-5">
                        {formatCurrency(visit.amount)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-5 max-w-[220px] truncate">
                        {visit.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No visit history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const isCompleted = normalized === "completed";
  const isCancelled = normalized === "cancelled";
  const isInProgress = normalized === "in progress";

  return (
    <span
      className={`text-sm py-1.5 rounded-full font-semibold inline-flex items-center justify-center min-w-24 px-3 ${
        isCompleted
          ? "bg-green-700 text-primary"
          : isCancelled
            ? "bg-red-100 text-red-600"
            : isInProgress
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-red-600"
      }`}
    >
      {status}
    </span>
  );
}