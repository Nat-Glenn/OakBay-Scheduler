/**
 * Deterministic morning briefing for the practice overview page (no LLM).
 */

import { prisma } from "@/lib/prisma";
import { AppointmentRequestStatus, AppointmentStatus } from "@prisma/client";
import { SCHEDULABLE_APPOINTMENT_STATUSES } from "@/lib/appointments/constants";
import {
  getClinicTodayBounds,
  getClinicTodayParts,
  getClinicPriorWeekBounds,
  getClinicWeekToDateBounds,
} from "@/lib/summary/clinicPeriods";

export type BriefingLink = {
  href: string;
  label: string;
};

export type BriefingItem = {
  id: string;
  tone: "neutral" | "attention" | "positive";
  message: string;
  link?: BriefingLink;
};

export type ClinicBriefing = {
  clinicDate: string;
  generatedAt: string;
  items: BriefingItem[];
  today: {
    total: number;
    completed: number;
    checkedIn: number;
    confirmed: number;
    requested: number;
    cancelled: number;
  };
  pendingRequests: number;
  overdueAppointments: number;
};

export async function buildClinicBriefing(): Promise<ClinicBriefing> {
  const now = new Date();
  const clinicDateParts = getClinicTodayParts(now);
  const clinicDate = `${clinicDateParts.year}-${String(clinicDateParts.month).padStart(2, "0")}-${String(clinicDateParts.day).padStart(2, "0")}`;
  const { start: todayStart, end: todayEnd } = getClinicTodayBounds(now);

  const weekBounds = getClinicWeekToDateBounds(now);
  const priorWeekBounds = getClinicPriorWeekBounds(now);

  const [
    statusGroups,
    pendingRequests,
    overdueAppointments,
    weekRevenue,
    priorWeekRevenue,
  ] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["status"],
      where: {
        startTime: { gte: todayStart, lte: todayEnd },
      },
      _count: { _all: true },
    }),
    prisma.appointmentRequest.count({
      where: { status: AppointmentRequestStatus.PENDING },
    }),
    prisma.appointment.count({
      where: {
        status: { in: [...SCHEDULABLE_APPOINTMENT_STATUSES] },
        endTime: { lt: now },
      },
    }),
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: weekBounds.start, lte: weekBounds.end },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: priorWeekBounds.start, lte: priorWeekBounds.end },
      },
      _sum: { amount: true },
    }),
  ]);

  const countByStatus = (status: AppointmentStatus) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  const today = {
    total: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
    completed: countByStatus(AppointmentStatus.COMPLETED),
    checkedIn: countByStatus(AppointmentStatus.CHECKED_IN),
    confirmed: countByStatus(AppointmentStatus.CONFIRMED),
    requested: countByStatus(AppointmentStatus.REQUESTED),
    cancelled: countByStatus(AppointmentStatus.CANCELLED),
  };

  const currentWeek = Number(weekRevenue._sum.amount ?? 0);
  const priorWeek = Number(priorWeekRevenue._sum.amount ?? 0);
  const items: BriefingItem[] = [];

  items.push({
    id: "today-volume",
    tone: "neutral",
    message: `${today.total} appointment${today.total === 1 ? "" : "s"} on today's schedule (${today.completed} completed, ${today.checkedIn} checked in).`,
    link: { href: "/", label: "Open scheduler" },
  });

  if (pendingRequests > 0) {
    items.push({
      id: "pending-requests",
      tone: "attention",
      message: `${pendingRequests} online booking request${pendingRequests === 1 ? "" : "s"} waiting for review.`,
      link: { href: "/Requests", label: "Review requests" },
    });
  }

  if (overdueAppointments > 0) {
    items.push({
      id: "overdue",
      tone: "attention",
      message: `${overdueAppointments} past appointment${overdueAppointments === 1 ? "" : "s"} still open (not checked in or completed).`,
      link: { href: "/", label: "View schedule" },
    });
  }

  if (priorWeek > 0) {
    const pct = Math.round(((currentWeek - priorWeek) / priorWeek) * 100);
    const direction = pct >= 0 ? "up" : "down";
    items.push({
      id: "week-revenue",
      tone: pct >= 0 ? "positive" : "neutral",
      message: `Checkout revenue this week is ${direction} ${Math.abs(pct)}% compared to last week ($${currentWeek.toFixed(2)} vs $${priorWeek.toFixed(2)}).`,
    });
  } else if (currentWeek > 0) {
    items.push({
      id: "week-revenue",
      tone: "positive",
      message: `$${currentWeek.toFixed(2)} collected at checkout so far this week.`,
    });
  }

  if (
    pendingRequests === 0 &&
    overdueAppointments === 0 &&
    today.total > 0 &&
    today.completed === today.total
  ) {
    items.push({
      id: "all-clear",
      tone: "positive",
      message: "All of today's appointments are completed and the request queue is clear.",
    });
  }

  return {
    clinicDate,
    generatedAt: now.toISOString(),
    items,
    today,
    pendingRequests,
    overdueAppointments,
  };
}
