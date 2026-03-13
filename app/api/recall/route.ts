
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api";

export async function GET() {
    try {
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const patients = await prisma.patient.findMany({
            include: {
                appointments: {
                    include: {
                        provider: true,
                        payment: true,
                    },
                    orderBy: {
                        startTime: "desc",
                    },
                },
            },
            orderBy: {
                lastName: "asc",
            },
        });

        const recallList = patients
            .map((patient) => {
                const appointments = patient.appointments;
                const futureAppointments = appointments.filter(
                    (a) => a.startTime > today && a.status !== "cancelled"
                );
                const completedAppointments = appointments.filter(
                    (a) => a.status === "completed"
                );

                const lastCompleted = completedAppointments[0] ?? null;

                const shouldRecall =
                    !!lastCompleted &&
                    lastCompleted.startTime < sixMonthsAgo &&
                    futureAppointments.length === 0;

                if (!shouldRecall) return null;

                return {
                    patientId: patient.id,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    phone: patient.phone,
                    email: patient.email,
                    reminderOptIn: patient.reminderOptIn,
                    lastCompletedAppointment: lastCompleted.startTime,
                    lastAppointmentType: lastCompleted.type,
                };
            })
            .filter(Boolean);

        return ok(recallList);
    } catch (err) {
        console.error(err);
        return serverError("Failed to load recall list");
    }
}