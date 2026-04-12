import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";

export async function GET() {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Start of current week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day;
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