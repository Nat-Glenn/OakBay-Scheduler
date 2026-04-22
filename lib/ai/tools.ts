import { prisma } from "@/lib/prisma";

function startOfToday() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getRangeDates(range: string) {
  const now = new Date();

  if (range === "daily") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (range === "weekly") {
    const start = new Date(now);
    const day = start.getDay(); // 0 = Sunday
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (range === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return { start, end };
  }

  if (range === "yearly") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { start, end };
  }

  return {
    start: new Date(0),
    end: new Date(),
  };
}

export async function getOverdueAppointments() {
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      status: {
        in: ["REQUESTED", "CONFIRMED"],
      },
      endTime: {
        lt: now,
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return appointments.map((appt) => ({
    id: appt.id,
    patientName: appt.patient
      ? `${appt.patient.firstName ?? ""} ${appt.patient.lastName ?? ""}`.trim()
      : "Unknown Patient",
    providerName: appt.provider?.name || "Unassigned",
    type: appt.type || "—",
    status: appt.status,
    startTime: appt.startTime,
    endTime: appt.endTime,
    patientPhone: appt.patient?.phone || "—",
    patientEmail: appt.patient?.email || "—",
  }));
}

export async function getPatientSummary(patientName: string) {
  const rawName = patientName.trim();

  if (!rawName) {
    return { found: false, message: "No matching patient found." };
  }

  const parts = rawName.split(/\s+/).filter(Boolean);
  const first = parts[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        {
          firstName: {
            contains: rawName,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: rawName,
            mode: "insensitive",
          },
        },
        ...(last
          ? [
              {
                AND: [
                  {
                    firstName: {
                      contains: first,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: last,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    },
    include: {
      appointments: {
        include: {
          payment: true,
          provider: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
      },
    },
    take: 5,
  });

  if (!patients.length) {
    return { found: false, message: "No matching patient found." };
  }

  const patient = patients[0];

  return {
    found: true,
    patient: {
      id: patient.id,
      name: `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim(),
      email: patient.email || "—",
      phone: patient.phone || "—",
      dob: patient.dob || null,
      appointmentCount: patient.appointments.length,
      appointments: patient.appointments.map((appt) => ({
        id: appt.id,
        type: appt.type,
        status: appt.status,
        startTime: appt.startTime,
        endTime: appt.endTime,
        providerName: appt.provider?.name || "Unassigned",
        paymentAmount: appt.payment?.amount ?? null,
        paymentMethod: appt.payment?.paymentType ?? null,
      })),
    },
  };
}

export async function getPractitionerDailySummary(practitionerName?: string) {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const whereClause = practitionerName
    ? {
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
        provider: {
          name: {
            contains: practitionerName,
            mode: "insensitive" as const,
          },
        },
      }
    : {
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      };

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      provider: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const grouped: Record<
    string,
    { total: number; completed: number; cancelled: number; checkedIn: number }
  > = {};

  for (const appt of appointments) {
    const providerName = appt.provider?.name || "Unassigned";

    if (!grouped[providerName]) {
      grouped[providerName] = {
        total: 0,
        completed: 0,
        cancelled: 0,
        checkedIn: 0,
      };
    }

    grouped[providerName].total += 1;

    if (appt.status === "COMPLETED") grouped[providerName].completed += 1;
    if (appt.status === "CANCELLED") grouped[providerName].cancelled += 1;
    if (appt.status === "CHECKED_IN") grouped[providerName].checkedIn += 1;
  }

  return {
    date: todayStart,
    practitioners: grouped,
  };
}

export async function getDailyOperationsReportData() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: {
      provider: {
        select: {
          name: true,
        },
      },
    },
  });

  const totals = {
    totalAppointments: appointments.length,
    completed: 0,
    cancelled: 0,
    checkedIn: 0,
    requested: 0,
    confirmed: 0,
  };

  const byPractitioner: Record<string, number> = {};

  for (const appt of appointments) {
    const providerName = appt.provider?.name || "Unassigned";
    byPractitioner[providerName] = (byPractitioner[providerName] || 0) + 1;

    if (appt.status === "COMPLETED") totals.completed += 1;
    if (appt.status === "CANCELLED") totals.cancelled += 1;
    if (appt.status === "CHECKED_IN") totals.checkedIn += 1;
    if (appt.status === "REQUESTED") totals.requested += 1;
    if (appt.status === "CONFIRMED") totals.confirmed += 1;
  }

  return {
    date: todayStart,
    totals,
    byPractitioner,
  };
}

export async function getOperationsReportByRange(range: string) {
  const { start, end } = getRangeDates(range);

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: start,
        lte: end,
      },
    },
    include: {
      provider: {
        select: {
          name: true,
        },
      },
    },
  });

  const totals = {
    totalAppointments: appointments.length,
    completed: 0,
    cancelled: 0,
    checkedIn: 0,
    requested: 0,
    confirmed: 0,
  };

  const byPractitioner: Record<string, number> = {};

  for (const appt of appointments) {
    const providerName = appt.provider?.name || "Unassigned";
    byPractitioner[providerName] = (byPractitioner[providerName] || 0) + 1;

    if (appt.status === "COMPLETED") totals.completed += 1;
    if (appt.status === "CANCELLED") totals.cancelled += 1;
    if (appt.status === "CHECKED_IN") totals.checkedIn += 1;
    if (appt.status === "REQUESTED") totals.requested += 1;
    if (appt.status === "CONFIRMED") totals.confirmed += 1;
  }

  return {
    range,
    start,
    end,
    totals,
    byPractitioner,
  };
}

export type FlexibleClinicQuery = {
  metric: string;
  status?: string;
  range?: string;
  minAmount?: number;
};

export async function getFlexibleClinicQuery(query: FlexibleClinicQuery) {
  const { metric, status, range = "monthly", minAmount } = query;
  const { start, end } = getRangeDates(range);

  const where: {
    startTime: { gte: Date; lte: Date };
    status?: string;
  } = {
    startTime: {
      gte: start,
      lte: end,
    },
  };

  if (status) {
    where.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      provider: {
        select: { name: true },
      },
      patient: true,
      payment: true,
    },
  });

  if (metric === "count") {
    return {
      count: appointments.length,
      range,
      status: status || "all",
    };
  }

  if (metric === "completed") {
    const completed = appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length;

    return {
      completed,
      range,
    };
  }

  if (metric === "cancelled") {
    const cancelled = appointments.filter(
      (a) => a.status === "CANCELLED"
    ).length;

    return {
      cancelled,
      range,
    };
  }

  if (metric === "high_value") {
    const filtered = appointments
      .filter((a) => a.payment?.amount != null)
      .filter((a) => Number(a.payment?.amount) >= (minAmount || 0));

    return filtered.map((a) => ({
      patient: a.patient
        ? `${a.patient.firstName ?? ""} ${a.patient.lastName ?? ""}`.trim()
        : "Unknown Patient",
      amount: a.payment ? Number(a.payment.amount) : null,
      provider: a.provider?.name || "Unknown",
    }));
  }

  if (metric === "by_practitioner") {
    const map: Record<string, number> = {};

    for (const a of appointments) {
      const name = a.provider?.name || "Unknown";
      map[name] = (map[name] || 0) + 1;
    }

    return map;
  }

  return {
    message: "Query not supported yet",
  };
}