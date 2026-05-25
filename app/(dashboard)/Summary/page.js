/**
 * Practice overview — clinic stats, morning briefing, latest appointments, and reports.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SummarySkeleton from "@/components/SummarySkeleton";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { apiFetch } from "@/utils/apiFetch";
import {
  Users,
  DollarSign,
  Calendar,
  Search,
  Sparkles,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
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
import { getHistoryStatusBadgeClasses } from "@/lib/ui/appointmentStatusStyles";

export default function Summary() {
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);
  const [patientQuery, setPatientQuery] = useState("");

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

  const stats = summaryData?.stats ?? {
    totalPatients: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    yearlyRevenue: 0,
    allTimeRevenue: 0,
    todaysAppointments: 0,
    priorWeekRevenue: 0,
    weeklyRevenueChangePct: null,
    weeklyPaymentCount: 0,
    monthlyPaymentCount: 0,
    yearlyPaymentCount: 0,
    revenueSpansMatch: false,
    todayCompleted: 0,
  };

  const briefing = summaryData?.briefing;
  const latestAppointments = summaryData?.latestAppointments ?? [];

  const filteredAppointments = useMemo(() => {
    const q = tableSearch.toLowerCase();
    return latestAppointments.filter((row) => {
      const patient = String(row.patient || "").toLowerCase();
      const type = String(row.type || "").toLowerCase();
      const provider = String(row.providerName || "").toLowerCase();
      return (
        patient.includes(q) || type.includes(q) || provider.includes(q)
      );
    });
  }, [latestAppointments, tableSearch]);

  async function runCopilot(body) {
    setReportLoading(true);
    setReportMessage(null);

    try {
      const res = await apiFetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      if (data.report) {
        setReportMessage({
          type: "report",
          reportKind: body.mode === "patient_report" ? "patient" : "daily",
          report: data.report,
        });
      } else {
        setReportMessage({
          type: "text",
          content: data.reply || "No response.",
        });
      }
    } catch (err) {
      setReportMessage({
        type: "text",
        content: err.message || "Failed to generate report.",
      });
    } finally {
      setReportLoading(false);
    }
  }

  if (summaryLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <PageHeader
          title="Practice overview"
          description="Loading clinic activity…"
        />
        <SummarySkeleton />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <PageHeader title="Practice overview" />
        <EmptyState
          title="Could not load overview"
          description={summaryError}
        />
      </div>
    );
  }

  const weekTrend =
    stats.weeklyRevenueChangePct === null
      ? "Week to date"
      : `${stats.weeklyRevenueChangePct >= 0 ? "+" : ""}${stats.weeklyRevenueChangePct}% vs last week`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
      <PageHeader
        title="Practice overview"
        description="Revenue and activity for Oak Bay Family Chiropractic"
      />

      <p className="-mt-2 mb-4 text-xs text-muted-foreground">
        {summaryData?.asOfLabel}
        {summaryData?.revenueNote ? ` · ${summaryData.revenueNote}` : ""}
      </p>

      {stats.revenueSpansMatch ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Week, month, and year show the same total because every checkout in the
          system was recorded in the same period ({stats.yearlyPaymentCount}{" "}
          payment{stats.yearlyPaymentCount === 1 ? "" : "s"},{" "}
          {formatCurrency(stats.allTimeRevenue)} all time). As you record more
          checkouts over time, these numbers will diverge.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total patients"
          value={stats.totalPatients}
          caption="Registered in system"
          icon={<Users />}
        />
        <StatCard
          title="Weekly revenue"
          value={formatCurrency(stats.weeklyRevenue)}
          caption={`${weekTrend} · ${stats.weeklyPaymentCount} checkout${stats.weeklyPaymentCount === 1 ? "" : "s"}`}
          icon={<DollarSign />}
        />
        <StatCard
          title="Monthly revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          caption={`Clinic month (MTD) · ${stats.monthlyPaymentCount} checkout${stats.monthlyPaymentCount === 1 ? "" : "s"}`}
          icon={<DollarSign />}
        />
        <StatCard
          title="Yearly revenue"
          value={formatCurrency(stats.yearlyRevenue)}
          caption={`Calendar year (YTD) · ${stats.yearlyPaymentCount} checkout${stats.yearlyPaymentCount === 1 ? "" : "s"}`}
          icon={<DollarSign />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 pb-4 lg:grid-cols-3">
        <BriefingCard briefing={briefing} className="lg:col-span-2" />

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-button-primary" />
              Today&apos;s schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Appointments today</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {stats.todaysAppointments}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.todayCompleted} completed · clinic day (Alberta time)
              </p>
            </div>
            <Link href="/" className="block">
              <Button variant="secondary" className="w-full font-semibold">
                Open scheduler
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 border-border shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Latest appointments
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Most recent visits by appointment date (all statuses)
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-52">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search…"
                className="h-10 pl-9"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="font-semibold" asChild>
              <Link href="/Summary/history">Visit history</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link
                        href={`/Patients?patientId=${row.patientId}`}
                        className="text-button-primary hover:underline"
                      >
                        {row.patient}
                      </Link>
                    </TableCell>
                    <TableCell>{formatVisitDate(row.date)}</TableCell>
                    <TableCell>{row.type || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.providerName}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={normalizeStatus(row.status)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No appointments"
                      description="Scheduled visits will appear here."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-button-primary" />
            Detailed reports (Copilot)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Structured reports from live clinic data. Requires Azure OpenAI in
            production.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={reportLoading}
              onClick={() => runCopilot({ mode: "daily_report" })}
            >
              Today&apos;s operations
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={reportLoading}
              onClick={() => runCopilot({ mode: "range_report", range: "monthly" })}
            >
              Monthly summary
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={reportLoading}
              onClick={() => runCopilot({ mode: "range_report", range: "yearly" })}
            >
              Yearly summary
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Patient name for report (e.g. first and last name)"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
              disabled={reportLoading}
              className="flex-1"
            />
            <Button
              variant="outline"
              disabled={reportLoading || !patientQuery.trim()}
              onClick={() =>
                runCopilot({
                  mode: "patient_report",
                  prompt: patientQuery.trim(),
                })
              }
            >
              Patient report
            </Button>
          </div>

          {reportLoading ? (
            <p className="text-sm text-muted-foreground">Generating report…</p>
          ) : null}

          {reportMessage ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              {reportMessage.type === "report" ? (
                <ReportMessage
                  reportKind={reportMessage.reportKind}
                  report={reportMessage.report}
                  formatAiDate={formatAiDate}
                />
              ) : (
                <p className="whitespace-pre-wrap">{reportMessage.content}</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function BriefingCard({ briefing, className = "" }) {
  return (
    <Card className={`border-border shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-button-primary" />
          Today&apos;s briefing
        </CardTitle>
        {briefing?.clinicDate ? (
          <p className="text-sm text-muted-foreground">
            Clinic date {briefing.clinicDate} (Alberta)
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {briefing?.items?.length ? (
          briefing.items.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 rounded-lg border px-3 py-3 text-sm ${
                item.tone === "attention"
                  ? "border-amber-500/40 bg-amber-500/10"
                  : item.tone === "positive"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-border bg-muted/30"
              }`}
            >
              {item.tone === "attention" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              ) : item.tone === "positive" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="leading-relaxed">{item.message}</p>
                {item.link ? (
                  <Link
                    href={item.link.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-button-primary hover:underline"
                  >
                    {item.link.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Briefing will appear when clinic data is available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, caption, icon }) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="px-5 pb-5 pt-6">
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-lg bg-muted p-2.5 text-button-primary">
            {React.cloneElement(icon, { size: 20, className: "text-current" })}
          </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {caption ? (
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  );
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
    timeZone: "America/Edmonton",
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
    timeZone: "America/Edmonton",
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
  ) {
    return "Completed";
  }
  if (lower === "checked-in" || lower === "checked_in") {
    return "In Progress";
  }
  if (lower === "cancelled" || lower === "canceled") return "Cancelled";
  if (lower === "requested") return "Requested";
  if (lower === "confirmed") return "Confirmed";

  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${getHistoryStatusBadgeClasses(status)}`}
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
          <p className="font-bold">{report.title || "Daily Report"}</p>
          {report.reportDate ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {report.reportDate}
            </p>
          ) : null}
        </div>

        {report.summary ? (
          <div>
            <p className="mb-1 font-semibold">Summary</p>
            <p className="leading-relaxed">{report.summary}</p>
          </div>
        ) : null}

        {report.metrics ? (
          <div>
            <p className="mb-2 font-semibold">Metrics</p>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <MiniMetric label="Total" value={report.metrics.totalAppointments} />
              <MiniMetric label="Completed" value={report.metrics.completed} />
              <MiniMetric label="Cancelled" value={report.metrics.cancelled} />
              <MiniMetric label="Checked in" value={report.metrics.checkedIn} />
              <MiniMetric label="Requested" value={report.metrics.requested} />
              <MiniMetric label="Confirmed" value={report.metrics.confirmed} />
            </div>
          </div>
        ) : null}

        {!!report.practitionerBreakdown?.length ? (
          <div>
            <p className="mb-1 font-semibold">By practitioner</p>
            <div className="space-y-1">
              {report.practitionerBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <span>{item.practitionerName}</span>
                  <span className="font-semibold">{item.appointmentCount}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!!report.highlights?.length ? (
          <div>
            <p className="mb-1 font-semibold">Highlights</p>
            <ul className="list-disc space-y-1 pl-5">
              {report.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!!report.recommendedActions?.length ? (
          <div>
            <p className="mb-1 font-semibold">Recommended actions</p>
            <ul className="list-disc space-y-1 pl-5">
              {report.recommendedActions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (reportKind === "patient") {
    return (
      <div className="space-y-3">
        <div>
          <p className="font-bold">{report.title || "Patient Report"}</p>
          {report.patientName ? (
            <p className="mt-1 text-muted-foreground">
              Patient: {report.patientName}
            </p>
          ) : null}
        </div>

        {report.summary ? (
          <div>
            <p className="mb-1 font-semibold">Summary</p>
            <p className="leading-relaxed">{report.summary}</p>
          </div>
        ) : null}

        {report.contact ? (
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Contact</p>
            <p>Email: {report.contact.email || "—"}</p>
            <p>Phone: {report.contact.phone || "—"}</p>
          </div>
        ) : null}

        {report.totals ? (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <MiniMetric label="Appointments" value={report.totals.totalAppointments} />
            <MiniMetric label="Completed" value={report.totals.completed} />
            <MiniMetric label="Cancelled" value={report.totals.cancelled} />
          </div>
        ) : null}

        {!!report.recentAppointments?.length ? (
          <div>
            <p className="mb-1 font-semibold">Recent appointments</p>
            <div className="space-y-2">
              {report.recentAppointments.map((appt, index) => (
                <div
                  key={index}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs"
                >
                  <p className="font-semibold">{appt.type}</p>
                  <p>{formatAiDate(appt.date)}</p>
                  <p>Status: {appt.status}</p>
                  <p>Provider: {appt.providerName}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background px-2 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value ?? 0}</p>
    </div>
  );
}
