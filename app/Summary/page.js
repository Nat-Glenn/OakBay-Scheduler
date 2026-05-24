"use client";

import React, { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/AppShell";
import SummarySkeleton from "@/components/SummarySkeleton";
import EmptyState from "@/components/EmptyState";
import { apiFetch } from "@/utils/apiFetch";
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
import { getHistoryStatusBadgeClasses } from "@/lib/ui/appointmentStatusStyles";

export default function Summary() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! How can I help you manage your practice today?",
      type: "text",
    },
  ]);

  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [tableSearch, setTableSearch] = useState("");

  const small = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummaryLoading(true);
        setSummaryError("");

        const res = await apiFetch("/api/summary", { cache: "no-store" });
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

  const recentVisits = useMemo(() => {
    return summaryData?.recentVisits || [];
  }, [summaryData]);

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

    const nextMessages = [
      ...messages,
      { role: "user", content: trimmed, type: "text" },
    ];
    setMessages(nextMessages);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          prompt: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ||
            data.error ||
            "Sorry, I couldn’t process that request.",
          type: "text",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error occurred.",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDailyReport() {
    if (isLoading) return;

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Generate today's daily operations report.",
        type: "text",
      },
    ]);

    try {
      const res = await apiFetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "daily_report",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate daily report");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "report",
          reportKind: "daily",
          report: data.report,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to generate daily report.",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePatientReport() {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Generate patient report: ${trimmed}`,
        type: "text",
      },
    ]);
    setQuery("");

    try {
      const res = await apiFetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "patient_report",
          prompt: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate patient report");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "report",
          reportKind: "patient",
          report: data.report,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to generate patient report.",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRangeReport(range) {
    if (isLoading) return;

    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Generate ${range} report`,
        type: "text",
      },
    ]);

    try {
      const res = await apiFetch("/api/ai/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "range_report",
          range,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "report",
          reportKind: "daily",
          report: data.report,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to generate report.",
          type: "text",
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

  function formatAiDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);

    return date.toLocaleString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function normalizeStatus(status) {
    if (!status) return "Pending";
    const lower = String(status).toLowerCase();

    if (
      lower === "checked-out" ||
      lower === "checked_out" ||
      lower === "completed" ||
      lower === "complete"
    )
      return "Completed";
    if (lower === "checked-in" || lower === "checked_in")
      return "In Progress";
    if (lower === "cancelled" || lower === "canceled") return "Cancelled";
    if (lower === "requested") return "Requested";
    if (lower === "confirmed") return "Confirmed";

    return String(status)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (summaryLoading) {
    return (
      <AppShell title="Summary">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
          <header className="hidden py-4 md:block">
            <h1 className="text-3xl font-bold text-foreground">Summary</h1>
          </header>
          <SummarySkeleton />
        </div>
      </AppShell>
    );
  }

  if (summaryError) {
    return (
      <AppShell title="Summary">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
          <header className="hidden py-4 md:block">
            <h1 className="text-3xl font-bold text-foreground">Summary</h1>
          </header>
          <EmptyState
            title="Could not load summary"
            description={summaryError}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Summary">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <header className="hidden py-4 md:block">
          <h1 className="text-3xl font-bold text-foreground">Summary</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 mt-4">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<Users />}
            trend="Live"
          />
          <StatCard
            title="Weekly Revenue"
            value={formatCurrency(stats.weeklyRevenue)}
            icon={<TrendingUp />}
            trend="Live"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={<DollarSign />}
            trend="Live"
          />
          <StatCard
            title="Yearly Revenue"
            value={formatCurrency(stats.yearlyRevenue)}
            icon={<DollarSign />}
            trend="Live"
          />
        </div>

        <div className="pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border shadow-sm">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 px-8 gap-4">
              <CardTitle className="text-xl font-bold">
                Recent Patient Visits
              </CardTitle>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="relative w-full overflow-hidden rounded-md border border-border md:w-48">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={14}
                  />
                  <Input
                    placeholder="Search by Name"
                    className="pl-8 bg-muted/50 border-none h-10 text-sm w-full focus-visible:ring-0"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>
                <Link href="/Summary/history">
                  <Button
                    variant="secondary"
                    className="h-10 font-semibold whitespace-nowrap"
                  >
                    View History
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 overflow-x-auto">
              <Table className="text-base min-w-[500px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="py-4 font-semibold text-muted-foreground">
                      Patient
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="py-4 text-center font-semibold text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
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
                        <TableCell className="py-5 text-center">
                          <StatusBadge status={normalizeStatus(visit.status)} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <EmptyState
                          title="No recent visits"
                          description="Completed appointments will appear here."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="py-6 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} className="text-button-primary" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
                  <span className="text-muted-foreground font-medium">
                    Scheduled
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    {stats.todaysAppointments}
                  </span>
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

      <div className="fixed bottom-8 right-8 flex flex-col items-end z-10">
        {isChatOpen && (
          <Card className="w-[380px] lg:w-[430px] h-[560px] max-h-[78vh] mb-2 shadow-2xl overflow-hidden p-0 animate-in slide-in-from-bottom-5 duration-300 flex flex-col bg-background">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 bg-button-primary p-5 text-white">
              <div className="flex flex-col">
                <CardTitle className="text-md font-bold text-inherit">
                  Clinic Copilot
                </CardTitle>
                <p className="mt-1 text-xs text-white/85">
                  Ask questions or generate reports
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 h-10 w-10 text-inherit hover:bg-white/15"
                onClick={() => setIsChatOpen(false)}
              >
                <X size={22} />
              </Button>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "self-end rounded-br-none bg-button-primary text-white whitespace-pre-wrap [&_p]:text-inherit"
                      : "self-start rounded-bl-none border border-border bg-card text-foreground [&_p]:text-inherit"
                  }`}
                >
                  {message.type === "report" ? (
                    <ReportMessage
                      reportKind={message.reportKind}
                      report={message.report}
                      formatAiDate={formatAiDate}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="self-start rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                  Clinic Copilot is working...
                </div>
              )}
            </CardContent>

            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDailyReport}
                  disabled={isLoading}
                >
                  Daily Report
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePatientReport}
                  disabled={isLoading || !query.trim()}
                >
                  Patient Report
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRangeReport("monthly")}
                  disabled={isLoading}
                >
                  Monthly Report
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRangeReport("yearly")}
                  disabled={isLoading}
                >
                  Yearly Report
                </Button>
              </div>

              <form className="flex gap-4 items-center" onSubmit={handleSend}>
                <div className="relative flex-1 overflow-hidden rounded-md border border-border">
                  <Input
                    placeholder="Ask a question or type a patient name (e.g. Chad Wick)"
                    className="h-12 border-none bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !query.trim()}
                  className="h-12 w-12 shrink-0 bg-button-primary text-white shadow-sm hover:bg-button-primary-foreground"
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
              ? "rotate-90 bg-muted text-foreground hover:bg-muted/80"
              : "scale-110 bg-button-primary text-white hover:bg-button-primary-foreground"
          }`}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </Button>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="pt-8 px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="rounded-xl bg-muted p-3 text-button-primary">
            {React.cloneElement(icon, { size: 24, className: "text-current" })}
          </div>
          <div className="flex items-center rounded-md bg-status-checked-in/25 px-2 py-1 text-sm font-semibold text-status-checked-in-foreground">
            {trend} <ArrowUpRight size={16} className="ml-1" />
          </div>
        </div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold ${getHistoryStatusBadgeClasses(status)}`}
    >
      {status}
    </span>
  );
}

function ReportMessage({ reportKind, report, formatAiDate }) {
  if (!report) return null;

  if (reportKind === "daily") {
    return (
      <div className="space-y-3">
        <div>
          <p className="font-bold text-base">{report.title || "Daily Report"}</p>
          {report.reportDate && (
            <p className="mt-1 text-xs text-muted-foreground">{report.reportDate}</p>
          )}
        </div>

        {report.summary && (
          <div>
            <p className="font-semibold text-sm mb-1">Summary</p>
            <p className="text-sm leading-6">{report.summary}</p>
          </div>
        )}

        {report.metrics && (
          <div>
            <p className="font-semibold text-sm mb-2">Metrics</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <MiniMetric label="Total" value={report.metrics.totalAppointments} />
              <MiniMetric label="Completed" value={report.metrics.completed} />
              <MiniMetric label="Cancelled" value={report.metrics.cancelled} />
              <MiniMetric label="Checked In" value={report.metrics.checkedIn} />
              <MiniMetric label="Requested" value={report.metrics.requested} />
              <MiniMetric label="Confirmed" value={report.metrics.confirmed} />
            </div>
          </div>
        )}

        {!!report.practitionerBreakdown?.length && (
          <div>
            <p className="font-semibold text-sm mb-1">Practitioner Breakdown</p>
            <div className="space-y-1">
              {report.practitionerBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
                >
                  <span>{item.practitionerName}</span>
                  <span className="font-semibold">{item.appointmentCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!!report.highlights?.length && (
          <div>
            <p className="font-semibold text-sm mb-1">Highlights</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {report.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {!!report.recommendedActions?.length && (
          <div>
            <p className="font-semibold text-sm mb-1">Recommended Actions</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {report.recommendedActions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (reportKind === "patient") {
    return (
      <div className="space-y-3">
        <div>
          <p className="font-bold text-base">{report.title || "Patient Report"}</p>
          {report.patientName && (
            <p className="mt-1 text-sm text-muted-foreground">Patient: {report.patientName}</p>
          )}
        </div>

        {report.summary && (
          <div>
            <p className="font-semibold text-sm mb-1">Summary</p>
            <p className="text-sm leading-6">{report.summary}</p>
          </div>
        )}

        {report.contact && (
          <div>
            <p className="font-semibold text-sm mb-2">Contact</p>
            <div className="space-y-1 text-sm">
              <p>Email: {report.contact.email || "—"}</p>
              <p>Phone: {report.contact.phone || "—"}</p>
            </div>
          </div>
        )}

        {report.totals && (
          <div>
            <p className="font-semibold text-sm mb-2">Totals</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <MiniMetric label="Appointments" value={report.totals.totalAppointments} />
              <MiniMetric label="Completed" value={report.totals.completed} />
              <MiniMetric label="Cancelled" value={report.totals.cancelled} />
            </div>
          </div>
        )}

        {!!report.recentAppointments?.length && (
          <div>
            <p className="font-semibold text-sm mb-1">Recent Appointments</p>
            <div className="space-y-2">
              {report.recentAppointments.map((appt, index) => (
                <div
                  key={index}
                  className="space-y-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px] leading-5"
                >
                  <p className="font-semibold">{appt.type}</p>
                  <p>{formatAiDate(appt.date)}</p>
                  <p>Status: {appt.status}</p>
                  <p>Provider: {appt.providerName}</p>
                  {appt.paymentAmount !== null && (
                    <p>
                      Payment: ${appt.paymentAmount} {appt.paymentMethod || ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!!report.recommendedActions?.length && (
          <div>
            <p className="font-semibold text-sm mb-1">Recommended Actions</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {report.recommendedActions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function MiniMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/40 px-2 py-2">
      <p className="break-words text-[11px] leading-4 text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value ?? 0}</p>
    </div>
  );
}