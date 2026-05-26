/**
 * Practice overview stats — clinic timezone revenue, today's volume, briefing, latest appointments.
 */

import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";
import { withAuthSimple } from "@/lib/withAuth";
import { buildClinicBriefing } from "@/lib/summary/briefing";
import {
  getClinicMonthBounds,
  getClinicPriorWeekBounds,
  getClinicTodayBounds,
  getClinicTodayParts,
  getClinicWeekToDateBounds,
  getClinicYearBounds,
} from "@/lib/summary/clinicPeriods";

function formatClinicDateLabel(at: Date = new Date()) {
  const parts = getClinicTodayParts(at);
  const { start } = getClinicTodayBounds(at);
  return start.toLocaleDateString("en-CA", {
    timeZone: "America/Edmonton",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const GET = withAuthSimple(async () => {
  try {
    const now = new Date();
    const todayBounds = getClinicTodayBounds(now);
    const weekBounds = getClinicWeekToDateBounds(now);
    const priorWeekBounds = getClinicPriorWeekBounds(now);
    const monthBounds = getClinicMonthBounds(now);
    const yearBounds = getClinicYearBounds(now);

    const [
      totalPatients,
      todaysAppointments,
      weeklyRevenueAgg,
      priorWeekRevenueAgg,
      monthlyRevenueAgg,
      yearlyRevenueAgg,
      allTimeRevenueAgg,
      weeklyPaymentCount,
      monthlyPaymentCount,
      yearlyPaymentCount,
      latestAppointments,
      briefing,
    ] = await Promise.all([
      prisma.patient.count(),

      prisma.appointment.count({
        where: {
          startTime: {
            gte: todayBounds.start,
            lte: todayBounds.end,
          },
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
          createdAt: {
            gte: priorWeekBounds.start,
            lte: priorWeekBounds.end,
          },
        },
        _sum: { amount: true },
      }),

      prisma.payment.aggregate({
        where: {
          createdAt: { gte: monthBounds.start, lte: monthBounds.end },
        },
        _sum: { amount: true },
      }),

      prisma.payment.aggregate({
        where: {
          createdAt: { gte: yearBounds.start, lte: yearBounds.end },
        },
        _sum: { amount: true },
      }),

      prisma.payment.aggregate({
        _sum: { amount: true },
      }),

      prisma.payment.count({
        where: {
          createdAt: { gte: weekBounds.start, lte: weekBounds.end },
        },
      }),

      prisma.payment.count({
        where: {
          createdAt: { gte: monthBounds.start, lte: monthBounds.end },
        },
      }),

      prisma.payment.count({
        where: {
          createdAt: { gte: yearBounds.start, lte: yearBounds.end },
        },
      }),

      prisma.appointment.findMany({
        orderBy: { startTime: "desc" },
        take: 10,
        select: {
          id: true,
          startTime: true,
          type: true,
          status: true,
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          provider: {
            select: { name: true },
          },
        },
      }),

      buildClinicBriefing(),
    ]);

    const weeklyRevenue = Number(weeklyRevenueAgg._sum.amount ?? 0);
    const monthlyRevenue = Number(monthlyRevenueAgg._sum.amount ?? 0);
    const yearlyRevenue = Number(yearlyRevenueAgg._sum.amount ?? 0);
    const allTimeRevenue = Number(allTimeRevenueAgg._sum.amount ?? 0);
    const priorWeekRevenue = Number(priorWeekRevenueAgg._sum.amount ?? 0);
    const weeklyRevenueChangePct =
      priorWeekRevenue > 0
        ? Math.round(((weeklyRevenue - priorWeekRevenue) / priorWeekRevenue) * 100)
        : null;

    const revenueSpansMatch =
      weeklyRevenue > 0 &&
      weeklyRevenue === monthlyRevenue &&
      monthlyRevenue === yearlyRevenue &&
      yearlyRevenue === allTimeRevenue;

    const latest = latestAppointments.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patient.id,
      patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      date: appointment.startTime,
      type: appointment.type,
      status: appointment.status,
      providerName: appointment.provider?.name ?? "—",
    }));

    return Response.json({
      asOfLabel: formatClinicDateLabel(now),
      revenueNote: "Revenue is based on checkout date (when payment was recorded).",
      stats: {
        totalPatients,
        todaysAppointments,
        weeklyRevenue,
        priorWeekRevenue,
        weeklyRevenueChangePct,
        monthlyRevenue,
        yearlyRevenue,
        allTimeRevenue,
        weeklyPaymentCount,
        monthlyPaymentCount,
        yearlyPaymentCount,
        revenueSpansMatch,
        todayCompleted: briefing.today.completed,
      },
      briefing,
      latestAppointments: latest,
    });
  } catch (err) {
    console.error("GET /api/summary error:", err);
    return serverError("Failed to load summary data");
  }
});
