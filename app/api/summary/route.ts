import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";

export async function GET() {
  try {
    const now = new Date();

    // Calgary timezone — handles MDT (UTC-6) and MST (UTC-7) automatically
    const CALGARY_TZ = "America/Edmonton";

    // Determine Calgary's current UTC offset in milliseconds
    const utcMs = new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
    const calgaryMs = new Date(now.toLocaleString("en-US", { timeZone: CALGARY_TZ })).getTime();
    const offsetMs = utcMs - calgaryMs;

    // Get today's date in Calgary timezone
    const calgaryDateStr = now.toLocaleDateString("en-CA", { timeZone: CALGARY_TZ });
    const [year, month, day] = calgaryDateStr.split("-").map(Number);

    // Start and end of today in Calgary, expressed as UTC
    const startOfToday = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + offsetMs);
    const endOfToday = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) + offsetMs);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Start of current week (Monday)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

    const [
      totalPatients,
      todaysAppointments,
      monthlyPayments,
      weeklyPayments,
      yearlyPayments,
      recentAppointments,
    ] = await Promise.all([

      prisma.patient.count(),

      prisma.appointment.count({
        where: {
          startTime: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      prisma.payment.findMany({
        where: {
          createdAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
        select: { amount: true },
      }),

      // Weekly revenue — current Monday to end of today
      prisma.payment.findMany({
        where: {
          createdAt: { gte: startOfWeek, lte: endOfToday },
        },
        select: { amount: true },
      }),

      // Yearly revenue — Jan 1 to end of year
      prisma.payment.findMany({
        where: {
          createdAt: { gte: startOfYear, lt: startOfNextYear },
        },
        select: { amount: true },
      }),

      prisma.appointment.findMany({
        orderBy: { startTime: "desc" },
        take: 10,
        include: { patient: true },
      }),
    ]);

    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const weeklyRevenue = weeklyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const yearlyRevenue = yearlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const recentVisits = recentAppointments.map((appointment) => ({
      id: appointment.id,
      patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      date: appointment.startTime,
      type: appointment.type,
      status: appointment.status,
    }));

    return Response.json({
      stats: {
        totalPatients,
        todaysAppointments,
        monthlyRevenue,
        weeklyRevenue,
        yearlyRevenue,
      },
      recentVisits,
    });
  } catch (err) {
    console.error("GET /api/summary error:", err);
    return serverError("Failed to load summary data");
  }
}