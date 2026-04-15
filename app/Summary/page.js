"use client";

import React, { useState, useMemo, useEffect } from "react";
import NavBarComp from "@/components/NavBarComp";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  MessageCircle,
  Send,
  X,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import Link from "next/link";

export default function Summary() {
  // AI Chat Assistant
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! How can I help you manage your practice today?",
    },
  ]);

  // Summary API state
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  // Table filtering
  const [tableSearch, setTableSearch] = useState("");

  const small = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummaryLoading(true);
        setSummaryError("");

        const res = await fetch("/api/summary", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load summary");

        const data = await res.json();
        setSummaryData(data);
      } catch (error) {
        console.error("Failed to load summary:", error);
        setSummaryError("Failed to load summary");
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, []);

  const stats = summaryData?.stats || {
    totalPatients: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    yearlyRevenue: 0,
    todaysAppointments: 0,
  };

  const recentVisits = summaryData?.recentVisits || [];

  const filteredVisits = useMemo(() => {
    return recentVisits.filter((visit) => {
      const patient = String(visit.patient || "").toLowerCase();
      const type = String(visit.type || "").toLowerCase();
      const search = tableSearch.toLowerCase();
      return patient.includes(search) || type.includes(search);
    });
  }, [recentVisits, tableSearch]);
async function handleSend(e) {
  e.preventDefault();

  const trimmed = query.trim();
  if (!trimmed || isLoading) return;

  const nextMessages = [...messages, { role: "user", content: trimmed }];
  setMessages(nextMessages);
  setQuery("");
  setIsLoading(true);

  try {
    const res = await fetch("/api/aiAssistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        messages: nextMessages.slice(-8),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "AI request failed");
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          typeof data?.reply === "string" && data.reply.trim()
            ? data.reply
            : "I couldn't generate a usable reply.",
      },
    ]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI error";

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `AI error: ${message}`,
      },
    ]);
  } finally {
    setIsLoading(false);
  }
}

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  }

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

  function normalizeStatus(status) {
    if (!status) return "Pending";
    const lower = String(status).toLowerCase();

    if (lower === "checked-out" || lower === "checked_out" || lower === "completed" || lower === "complete")
      return "Completed";
    if (lower === "checked-in" || lower === "checked_in")
      return "In Progress";
    if (lower === "cancelled" || lower === "canceled")
      return "Cancelled";
    if (lower === "requested")
      return "Requested";

    return String(status)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (summaryLoading) {
    return (
      <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
        <NavBarComp />
        <div className="flex flex-col min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">
          {!small && <header className="py-4"><h1 className="text-3xl font-bold text-foreground">Summary</h1></header>}
          <div className="p-6 text-foreground">Loading summary...</div>
        </div>
      </main>
    );
  }

  if (summaryError) {
    return (
      <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
        <NavBarComp />
        <div className="flex flex-col min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">
          {!small && <header className="py-4"><h1 className="text-3xl font-bold text-foreground">Summary</h1></header>}
          <div className="p-6 text-red-500">{summaryError}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">
        {!small && (
          <header className="py-4">
            <h1 className="text-3xl font-bold text-foreground">Summary</h1>
          </header>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 mt-4">
          <StatCard title="Total Patients" value={stats.totalPatients} icon={<Users />} trend="Live" />
          <StatCard title="Weekly Revenue" value={formatCurrency(stats.weeklyRevenue)} icon={<TrendingUp />} trend="Live" />
          <StatCard title="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} icon={<DollarSign />} trend="Live" />
          <StatCard title="Yearly Revenue" value={formatCurrency(stats.yearlyRevenue)} icon={<DollarSign />} trend="Live" />
        </div>

        {/* SECOND ROW */}
        <div className="pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* RECENT VISITS TABLE */}
          <Card className="lg:col-span-2 shadow-sm border-sidebar">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 px-8 gap-4">
              <CardTitle className="text-xl font-bold">Recent Patient Visits</CardTitle>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="relative flex-1 md:flex-none w-full md:w-48 border border-sidebar dark:border-foreground rounded-md overflow-hidden">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    placeholder="Search by Name"
                    className="pl-8 bg-muted/50 border-none h-10 text-sm w-full focus-visible:ring-0"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>
                <Link href="/Summary/history">
                  <Button variant="secondary" className="h-10 font-semibold whitespace-nowrap">
                    View History
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 overflow-x-auto">
              <Table className="text-base min-w-[500px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="py-4 text-primary/50">Patient</TableHead>
                    <TableHead className="py-4 text-primary/50">Date</TableHead>
                    <TableHead className="py-4 text-primary/50">Type</TableHead>
                    <TableHead className="py-4 text-primary/50 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-foreground py-5">{visit.patient}</TableCell>
                        <TableCell className="font-medium text-foreground py-5">{formatVisitDate(visit.date)}</TableCell>
                        <TableCell className="font-medium text-foreground py-5">{visit.type || "—"}</TableCell>
                        <TableCell className="py-5 text-center">
                          <StatusBadge status={normalizeStatus(visit.status)} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No recent visits found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* TODAY'S APPOINTMENTS */}
          <Card className="shadow-sm border-sidebar">
            <CardHeader className="py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} className="text-button-primary" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-primary/5 border border-sidebar">
                  <span className="text-muted-foreground font-medium">Scheduled</span>
                  <span className="text-3xl font-bold text-primary">{stats.todaysAppointments}</span>
                </div>
                <Link href="/" className="block w-full">
                  <Button variant="secondary" className="w-full font-semibold">
                    View Schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* AI CHAT ASSISTANT */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end z-10">
        {isChatOpen && (
          <Card className="w-75 lg:w-96 mb-2 shadow-2xl overflow-hidden p-0 animate-in slide-in-from-bottom-5 duration-300 flex flex-col bg-background">
            <CardHeader className="bg-sidebar text-white font-bold p-5 flex flex-row items-center justify-between space-y-0">
              <div className="flex flex-col">
                <CardTitle className="text-md font-bold text-white">Practice Assistant</CardTitle>
                <p className="text-xs text-blue-200 mt-1">How can I help you today?</p>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10 -mr-2" onClick={() => setIsChatOpen(false)}>
                <X size={22} />
              </Button>
            </CardHeader>

            <CardContent className="h-80 p-4 overflow-y-auto flex flex-col gap-3">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl text-base shadow-sm max-w-[85%] ${
                    message.role === "user"
                      ? "bg-[#A0CE66] text-white self-end rounded-br-none"
                      : "bg-slate-100 text-slate-700 self-start rounded-bl-none"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-slate-100 p-4 rounded-2xl text-base text-slate-500 self-start">
                  Thinking...
                </div>
              )}
            </CardContent>

            <div className="p-4">
              <form className="flex gap-4 items-center" onSubmit={handleSend}>
                <div className="relative flex-1 border border-sidebar dark:border-foreground rounded-md overflow-hidden">
                  <Input
                    placeholder="Type your message"
                    className="bg-transparent h-12 text-foreground border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !query.trim()}
                  className="h-12 w-12 bg-[#A0CE66] hover:bg-[#A0CE66]/80 text-white shrink-0 shadow-sm"
                >
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        )}

        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
            isChatOpen
              ? "bg-slate-200 text-slate-600 rotate-90"
              : "bg-[#7AC242] text-white hover:bg-[#7AC242]/90 scale-110"
          }`}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </Button>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <Card className="border-sidebar shadow-sm hover:shadow-md transition-shadow bg-primary/10">
      <CardContent className="pt-8 px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            {React.cloneElement(icon, { size: 24, color: "#002D58" })}
          </div>
          <div className="flex items-center text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
            {trend} <ArrowUpRight size={16} className="ml-1" />
          </div>
        </div>
        <h3 className="text-md font-medium text-primary uppercase tracking-wider text-xs">{title}</h3>
        <p className="text-3xl font-bold text-primary mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const isCompleted = normalized === "completed";
  const isCancelled = normalized === "cancelled";
  const isInProgress = normalized === "in progress";
  const isRequested = normalized === "requested";

  return (
    <span
      className={`text-sm py-1.5 rounded-full font-semibold inline-flex items-center justify-center min-w-24 px-3 ${
        isCompleted
          ? "bg-green-700 text-primary"
          : isCancelled
            ? "bg-red-100 text-red-600"
            : isInProgress
              ? "bg-blue-100 text-blue-700"
              : isRequested
                ? "bg-yellow-100 text-yellow-700"
                : "bg-yellow-100 text-red-600"
      }`}
    >
      {status}
    </span>
  );
}