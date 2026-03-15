
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api";
import { sendReminderEmail } from "@/lib/email";

export async function POST() {
    try {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: now,
                    lte: next24Hours,
                },
                status: {
                    in: ["requested", "confirmed"],
                },
                reminderSent: false,
                patient: {
                    reminderOptIn: true,
                    email: {
                        not: null,
                    },
                },
            },
            include: {
                patient: true,
                provider: true,
            },
            orderBy: {
                startTime: "asc",
            },
        });

        const results = [];

        for (const appointment of appointments) {
            if (!appointment.patient.email) continue;

            const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;

            const emailResult = await sendReminderEmail({
                to: appointment.patient.email,
                patientName,
                appointmentType: appointment.type,
                startTime: appointment.startTime,
            });

            if (emailResult.success) {
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: {
                        reminderSent: true,
                        reminderSentAt: new Date(),
                    },
                });

                results.push({
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    email: appointment.patient.email,
                    sent: true,
                });
            }
        }

        return ok({
            message: "Reminder job completed",
            sentCount: results.length,
            results,
        });
    } catch (err) {
        console.error(err);
        return serverError("Failed to send reminders");
    }
}
