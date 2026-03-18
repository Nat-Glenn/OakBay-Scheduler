"use client";

import React, { useState } from "react";
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! How can I help you manage your practice today?",
    },
  ]);

  const small = useMediaQuery("(max-width: 768px)");

  const recentVisits = [
    {
      id: "V001",
      patient: "John Doe",
      date: "Feb 19, 2026",
      type: "Checkup",
      status: "Completed",
    },
    {
      id: "V002",
      patient: "Jane Smith",
      date: "Feb 18, 2026",
      type: "Consultation",
      status: "Completed",
    },
    {
      id: "V003",
      patient: "Robert Wilson",
      date: "Feb 18, 2026",
      type: "Follow-up",
      status: "Pending",
    },
  ];

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn’t generate a response.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Something went wrong.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col h-dvh w-full bg-background relative overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">
        {/* Page Header */}
        {!small ? (
          <header className="py-4">
            <h1 className="text-3xl font-bold text-foreground">Summary</h1>
          </header>
        ) : (
          <header className="py-2"></header>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
          <StatCard title="Total Patients" value="1,284" icon={<Users />} trend="+12%" />
          <StatCard title="Monthly Revenue" value="$42,500" icon={<DollarSign />} trend="+5.4%" />
          <StatCard title="Monthly Expenses" value="$12,300" icon={<TrendingUp />} trend="-2.1%" />
          <StatCard title="Today's Appts" value="18" icon={<Calendar />} trend="Active" />
        </div>

        {/* Main Content Grid */}
        <div className="pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Recent Patient Visits */}
          <Card className="lg:col-span-2 shadow-sm border-sidebar">
            <CardHeader className="flex flex-row items-center justify-between py-6 px-8">
              <CardTitle className="text-xl font-bold">Recent Patient Visits</CardTitle>

              <Link href="/Summary/history">
                <Button variant="secondary" className="h-12 font-semibold">
                  View All History
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Table className="text-base">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="py-4 text-primary/50">Patient</TableHead>
                    <TableHead className="py-4 text-primary/50">Date</TableHead>
                    <TableHead className="py-4 text-primary/50">Type</TableHead>
                    <TableHead className="py-4 text-primary/50">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVisits.map((visit) => (
                    <TableRow key={visit.id} className="border-b last:border-0">
                      <TableCell className="font-medium text-foreground py-5">{visit.patient}</TableCell>
                      <TableCell className="py-5 text-muted-foreground">{visit.date}</TableCell>
                      <TableCell className="py-5 text-muted-foreground">{visit.type}</TableCell>
                      <TableCell className="py-5 text-muted-foreground">
                        <span className={`text-sm py-1.5 rounded-full font-semibold inline-flex items-center justify-center w-24 ${
                            visit.status === "Completed" ? "bg-[#a0ce66] text-primary" : "bg-yellow-100 text-red-600"
                          }`}>
                          {visit.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="shadow-sm border-sidebar">
            <CardHeader className="py-6 px-8">
              <CardTitle className="text-xl font-bold">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-8">
                {/* Medical Supplies */}
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-primary font-medium">Medical Supplies</span>
                    <span className="font-bold text-foreground">$4,200</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className="bg-[#002D58] h-3 rounded-full" style={{ width: "65%" }}></div>
                  </div>
                </div>

                {/* Staff Salaries */}
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-primary font-medium">Staff Salaries</span>
                    <span className="font-bold text-foreground">$6,800</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className="bg-[#A0CE66] h-3 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>

                {/* Facility Rent */}
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-primary font-medium">Facility Rent</span>
                    <span className="font-bold text-foreground">$1,300</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className="bg-blue-400 h-3 rounded-full" style={{ width: "40%" }}></div>
                  </div>
                </div>

                {/* Total Expenses Section */}
                <div className="pt-6 border-t mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold text-foreground">Total Expenses</span>
                    <span className="text-xl font-bold text-destructive">$12,300</span>
                  </div>
                  {/* <Button className="w-full h-12 text-md bg-button-primary hover:bg-button-primary-foreground text-white font-semibold shadow-md">
                    Download Full Report
                  </Button> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Assistant Section */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end z-1">
        {isChatOpen && (
          <Card className="w-75 lg:w-96 mb-2 shadow-2xl border-none overflow-hidden p-0 animate-in slide-in-from-bottom-5 duration-300">
            {/* Chat Header */}
            <CardHeader className="bg-[#002D58] text-white p-5 flex flex-row items-center justify-between space-y-0">
              <div className="flex flex-col">
                <CardTitle className="text-md font-bold text-white">Practice Assistant</CardTitle>
                <p className="text-xs text-blue-200 mt-1">How can I help you today?</p>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10 -mr-2" onClick={() => setIsChatOpen(false)}>
                <X size={22} />
              </Button>
            </CardHeader>

            {/* Message History */}
            <CardContent className="p-4 h-80 overflow-y-auto bg-white flex flex-col gap-3">
              {messages.map((message, index) => (
                <div key={index} className={`p-4 rounded-2xl text-base shadow-sm max-w-[85%] ${
                    message.role === "user" ? "bg-[#A0CE66] text-white self-end rounded-br-none" : "bg-slate-100 text-slate-700 self-start rounded-bl-none"
                  }`}>
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none text-base text-slate-500 max-w-[85%] shadow-sm self-start">Thinking...</div>
              )}
            </CardContent>

            {/* Chat Input */}
            <div className="p-4 border-t bg-white">
              <form className="flex gap-4 items-center" onSubmit={handleSend}>
                <Input
                  placeholder="Type your message..."
                  className="bg-slate-700 h-12 text-background border-slate-200 focus-visible:ring-[#002D58]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !query.trim()} className="h-12 w-12 bg-[#A0CE66] hover:bg-[#A0CE66]/80 text-white shrink-0 shadow-sm transition-colors">
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Chat Toggle Button */}
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
            isChatOpen ? "bg-slate-200 text-slate-600 rotate-90" : "bg-[#7AC242] text-white hover:bg-[#7AC242]/90 scale-110"
          }`}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </Button>
      </div>
    </main>
  );
}

{/* StatCard Component */}
function StatCard({ title, value, icon, trend }) {
  return (
    <Card className="border-sidebar shadow-sm hover:shadow-md transition-shadow bg-primary/10 ">
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