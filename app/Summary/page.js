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

export default function Summary() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  return (
    <main className="flex min-h-dvh w-full bg-slate-50 relative">
      <NavBarComp />

      <div className="flex-1 p-10">
        {/* PAGE HEADER */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-[#002D58]">Summary</h1>
          <p className="text-lg text-gray-500 mt-1">
            A snapshot of your clinic&apos;s current activity and finances.
          </p>
        </header>

        {/* STATISTICAL OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Patients"
            value="1,284"
            icon={<Users />}
            trend="+12%"
          />
          <StatCard
            title="Monthly Revenue"
            value="$42,500"
            icon={<DollarSign />}
            trend="+5.4%"
          />
          <StatCard
            title="Monthly Expenses"
            value="$12,300"
            icon={<TrendingUp />}
            trend="-2.1%"
          />
          <StatCard
            title="Today's Appts"
            value="18"
            icon={<Calendar />}
            trend="Active"
          />
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* RECENT VISITS TABLE CARD */}
          <Card className="lg:col-span-2 shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between py-6 px-8">
              <CardTitle className="text-xl font-bold">
                Recent Patient Visits
              </CardTitle>
              <Button className="flex h-12 text-md bg-[#002D58] hover:bg-[#002D58]/90 text-white font-semibold">
                View All History
              </Button>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Table className="text-base">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="py-4">Patient</TableHead>
                    <TableHead className="py-4">Date</TableHead>
                    <TableHead className="py-4">Type</TableHead>
                    <TableHead className="py-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVisits.map((visit) => (
                    <TableRow
                      key={visit.id}
                      className="text-gray-700 border-b last:border-0 hover:bg-slate-50/50"
                    >
                      <TableCell className="font-semibold py-5">
                        {visit.patient}
                      </TableCell>
                      <TableCell className="py-5">{visit.date}</TableCell>
                      <TableCell className="py-5">{visit.type}</TableCell>
                      <TableCell className="py-5">
                        <span
                          className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
                            visit.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {visit.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* FINANCIAL OVERVIEW CARD */}
          <Card className="shadow-sm border-none">
            <CardHeader className="py-6 px-8">
              <CardTitle className="text-xl font-bold">
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-8">
                {/* Individual Expense Progress Bars */}
                <ExpenseItem
                  label="Medical Supplies"
                  amount="$4,200"
                  percentage={65}
                  color="bg-[#002D58]"
                />
                <ExpenseItem
                  label="Staff Salaries"
                  amount="$6,800"
                  percentage={85}
                  color="bg-[#A0CE66]"
                />
                <ExpenseItem
                  label="Facility Rent"
                  amount="$1,300"
                  percentage={40}
                  color="bg-blue-400"
                />

                {/* Total Summary Section */}
                <div className="pt-6 border-t mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold text-gray-700">
                      Total Expenses
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      $12,300
                    </span>
                  </div>
                  <Button className="w-full h-12 text-md bg-[#002D58] hover:bg-[#002D58]/90 text-white font-semibold shadow-md">
                    Download Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI CHATBOT UI */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end z-50">
        {isChatOpen && (
          <Card className="w-96 mb-6 shadow-2xl border-none overflow-hidden p-0 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header with Close Button */}
            <CardHeader className="bg-[#002D58] text-white p-5 flex flex-row items-center justify-between space-y-0">
              <div className="flex flex-col">
                <CardTitle className="text-md font-bold text-white">
                  Practice Assistant
                </CardTitle>
                <p className="text-xs text-blue-200 mt-1">
                  How can I help you today?
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-10 w-10 -mr-2"
                onClick={() => setIsChatOpen(false)}
              >
                <X size={22} />
              </Button>
            </CardHeader>

            {/* Message Area */}
            <CardContent className="p-6 h-80 overflow-y-auto bg-white flex flex-col justify-end">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none text-base text-slate-700 mb-2 max-w-[85%] shadow-sm">
                Hello! How can I help you manage your practice today?
              </div>
            </CardContent>

            {/* Message Input Box */}
            <div className="p-4 border-t bg-white">
              <form
                className="flex gap-3 items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery("");
                }}
              >
                <Input
                  placeholder="Type your message..."
                  className="bg-slate-50 h-12 text-base border-slate-200 focus-visible:ring-[#002D58]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button
                  size="icon"
                  className="h-12 w-12 bg-[#A0CE66] hover:bg-[#A0CE66]/80 text-white shrink-0 shadow-sm transition-colors"
                >
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Floating Action Button */}
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300  ${
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

// StatCard
function StatCard({ title, value, icon, trend }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-8 px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            {React.cloneElement(icon, {
              size: 24,
              color: "#002D58",
            })}
          </div>
          <div className="flex items-center text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
            {trend} <ArrowUpRight size={16} className="ml-1" />
          </div>
        </div>
        <h3 className="text-md font-medium text-gray-500 uppercase tracking-wider text-xs">
          {title}
        </h3>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
// Financial Overview Card

function ExpenseItem({ label, amount, percentage, color }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-base">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{amount}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3">
        {/* Animated-width progress bar */}
        <div
          className={`${color} h-3 rounded-full transition-all duration-1000 ease-in-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
