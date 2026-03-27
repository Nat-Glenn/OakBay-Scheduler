"use client";

import React, { useState, useMemo } from "react";
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
  ChevronRight,
  Receipt,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import Link from "next/link";

export default function Summary() {
  // State for AI Chat Assistant
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you manage your practice today?" },
  ]);

  // State for table filtering and modals
  const [tableSearch, setTableSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);

  const small = useMediaQuery("(max-width: 768px)");

  // Mock data for expense
  const expenseDetails = {
    "Medical Supplies": [
      { id: "TX-101", item: "Latex Gloves (Bulk)", date: "Feb 15", cost: "$1,200" },
      { id: "TX-102", item: "Syringes & Needles", date: "Feb 12", cost: "$800" },
      { id: "TX-103", item: "Sterilization Trays", date: "Feb 05", cost: "$2,200" },
    ],
    "Staff Salaries": [
      { id: "PAY-01", item: "Nursing Staff (Admin)", date: "Feb 01", cost: "$4,500" },
      { id: "PAY-02", item: "Reception Desk", date: "Feb 01", cost: "$2,300" },
    ],
    "Facility Rent": [
      { id: "RENT-Feb", item: "Main Office Lease", date: "Feb 01", cost: "$1,100" },
      { id: "UTIL-Feb", item: "Water & Electricity", date: "Feb 10", cost: "$200" },
    ],
  };

  const recentVisits = [
    { id: "V001", patient: "John Doe", date: "Feb 19, 2026", type: "Checkup", status: "Completed" },
    { id: "V002", patient: "Jane Smith", date: "Feb 18, 2026", type: "Consultation", status: "Completed" },
    { id: "V003", patient: "Robert Wilson", date: "Feb 18, 2026", type: "Follow-up", status: "Pending" },
  ];

  // Filters the visit table based on the search input
  const filteredVisits = useMemo(() => {
    return recentVisits.filter(v =>
      v.patient.toLowerCase().includes(tableSearch.toLowerCase()) ||
      v.type.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [tableSearch]);

  // Handles AI Assistant chat interaction
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
        body: JSON.stringify({ message: trimmed, messages: nextMessages.slice(-8) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Done." }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error occurred." }]);
    } finally {
      setIsLoading(false);
    }
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

        {/* Top Stat Grid: Patients, Revenue, Expenses, Appointments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 mt-4">
          <StatCard title="Total Patients" value="1,284" icon={<Users />} trend="+12%" />
          <StatCard title="Monthly Revenue" value="$42,500" icon={<DollarSign />} trend="+5.4%" />
          <StatCard title="Monthly Expenses" value="$12,300" icon={<TrendingUp />} trend="-2.1%" />
          <StatCard title="Today's Appts" value="18" icon={<Calendar />} trend="Active" />
        </div>

        <div className="pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Table: Recent Activity */}
          <Card className="lg:col-span-2 shadow-sm border-sidebar">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 px-8 gap-4">
              <CardTitle className="text-xl font-bold">Recent Patient Visits</CardTitle>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="relative flex-1 md:flex-none w-full md:w-48 border border-sidebar dark:border-foreground rounded-md overflow-hidden">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    placeholder="Search"
                    className="pl-8 bg-muted/50 border-none h-10 text-sm w-full focus-visible:ring-0"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>
                <Link href="/Summary/history">
                  <Button variant="secondary" className="h-10 font-semibold whitespace-nowrap">View History</Button>
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
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-foreground py-5">{visit.patient}</TableCell>
                      <TableCell className="font-medium text-foreground py-5">{visit.date}</TableCell>
                      <TableCell className="font-medium text-foreground py-5">{visit.type}</TableCell>
                      <TableCell className="py-5 text-center">
                        <StatusBadge status={visit.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Financial Overview with Progress Bars */}
          <Card className="shadow-sm border-sidebar">
            <CardHeader className="py-6 px-8">
              <CardTitle className="text-xl font-bold">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-8">
                <ProgressItem label="Medical Supplies" value="$4,200" percentage="65%" color="bg-blue-500" onClick={() => setSelectedExpense("Medical Supplies")} />
                <ProgressItem label="Staff Salaries" value="$6,800" percentage="85%" color="bg-green-500" onClick={() => setSelectedExpense("Staff Salaries")} />
                <ProgressItem label="Facility Rent" value="$1,300" percentage="40%" color="bg-red-500" onClick={() => setSelectedExpense("Facility Rent")} />
                <div className="pt-6 border-t mt-8 flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">Total Expenses</span>
                  <span className="text-xl font-bold text-destructive">$12,300</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shows detailed transactions when an expense category is clicked */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="sm:max-w-md bg-background border-sidebar text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="text-[#A0CE66]" size={20} />
              {selectedExpense} Breakdown
            </DialogTitle>
            <DialogDescription>Detailed transactions for the current month.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {selectedExpense && expenseDetails[selectedExpense].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-sidebar/20 bg-muted/30">
                <div>
                  <p className="font-bold text-sm">{item.item}</p>
                  <p className="text-xs text-muted-foreground">{item.date} • {item.id}</p>
                </div>
                <span className="font-mono font-bold text-[#A0CE66]">{item.cost}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button & Chat Window */}
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
              {messages.map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl text-base shadow-sm max-w-[85%] ${m.role === "user" ? "bg-[#A0CE66] text-white self-end rounded-br-none" : "bg-slate-100 text-slate-700 self-start rounded-bl-none"}`}>
                  {m.content}
                </div>
              ))}
              {isLoading && <div className="bg-slate-100 p-4 rounded-2xl text-base text-slate-500 self-start">Thinking...</div>}
            </CardContent>

            <div className="p-4">
              <form className="flex gap-4 items-center" onSubmit={handleSend}>
                <div className="relative flex-1 border border-sidebar dark:border-foreground rounded-md overflow-hidden ">
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
          className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${isChatOpen ? "bg-slate-200 text-slate-600 rotate-90" : "bg-[#7AC242] text-white hover:bg-[#7AC242]/90 scale-110"}`}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </Button>
      </div>
    </main>
  );
}

/* Reusable component for the four main stats at the top */
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

/* Reusable component for financial category progress bars */
function ProgressItem({ label, value, percentage, color, onClick }) {
  return (
    <div className="space-y-2 cursor-pointer group p-2 mb-2 rounded-xl hover:bg-button-secondary/50 transition-all" onClick={onClick}>
      <div className="flex justify-between text-base items-center">
        <span className="font-medium text-primary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{value}</span>
          <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className={`${color} h-3 rounded-full transition-all duration-500`} style={{ width: percentage }}></div>
      </div>
    </div>
  );
}

/* badge component for visit status coloring */
function StatusBadge({ status }) {
  const isCompleted = status === "Completed";
  return (
    <span className={`text-sm py-1.5 rounded-full font-semibold inline-flex items-center justify-center w-24 ${isCompleted ? "bg-green-700 text-primary" : "bg-yellow-100 text-red-600"}`}>
      {status}
    </span>
  );
}