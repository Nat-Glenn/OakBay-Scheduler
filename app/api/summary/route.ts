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

    const [
  totalPatients,
  todaysAppointments,
  monthlyPayments,
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
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        select: {
          amount: true,
        },
      }),

      prisma.appointment.findMany({
        orderBy: {
          startTime: "desc",
        },
        take: 10,
        include: {
          patient: true,
        },
      }),
    ]);

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    
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
  },
  recentVisits,
});
  } catch (err) {
    console.error("GET /api/summary error:", err);
    return serverError("Failed to load summary data");
  }
}