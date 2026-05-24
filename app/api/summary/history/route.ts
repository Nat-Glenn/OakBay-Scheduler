import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";
import { withAuthSimple } from "@/lib/withAuth";

function parseStatusFilter(value: string): AppointmentStatus | undefined {
  const upper = value.trim().toUpperCase();
  if (!upper) return undefined;
  return Object.values(AppointmentStatus).includes(upper as AppointmentStatus)
    ? (upper as AppointmentStatus)
    : undefined;
}

export const GET = withAuthSimple(async (req) => {
  try {
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get("search") ?? "").trim();
    const statusParam = (searchParams.get("status") ?? "").trim();
    const statusFilter = parseStatusFilter(statusParam);
    const limit = Number(searchParams.get("limit") ?? "100");

    const visits = await prisma.appointment.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  {
                    patient: {
                      firstName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                  {
                    patient: {
                      lastName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                  {
                    type: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},
          statusFilter ? { status: statusFilter } : {},
        ],
      },
      orderBy: {
        startTime: "desc",
      },
      take: Number.isNaN(limit) ? 100 : limit,
      include: {
        patient: true,
        payment: true,
      },
    });

    const history = visits.map((visit) => ({
      id: visit.id,
      patient: `${visit.patient.firstName} ${visit.patient.lastName}`,
      date: visit.startTime,
      type: visit.type,
      status: visit.status,
      // FIXED: was visit.payment?.method — field is paymentType not method
      paymentMethod: visit.payment?.paymentType ?? null,
      amount: visit.payment?.amount ?? null,
    }));

    return Response.json(history);
  } catch (error) {
    console.error("GET /api/summary/history error:", error);
    return serverError("Failed to load visit history");
  }
});