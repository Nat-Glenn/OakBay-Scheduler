import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api";
import { sendReminderEmail } from "@/lib/email";

export async function POST() {
    try {
        // Get current time and calculate 24 hours from now
        // 24 * 60 * 60 * 1000 = 24 hours in milliseconds
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find all appointments that need a reminder sent
        // ALL of these conditions must be true:
        const appointments = await prisma.appointment.findMany({
            where: {
                // Appointment is happening in the next 24 hours
                startTime: {
                    gte: now,
                    lte: next24Hours,
                },
                // Only active appointments — not completed or cancelled
                status: {
                    in: ["REQUESTED", "CONFIRMED"],
                },
                // Haven't already sent a reminder for this appointment
                reminderSent: false,
                // Patient must have opted in AND have an email address
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

        // Loop through each appointment and send a reminder
        for (const appointment of appointments) {
            // Extra safety check — skip if no email (shouldn't happen due to query filter above)
            if (!appointment.patient.email) continue;

            // Combine first and last name for the email message
            const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;

            // Call the email function (currently simulated — logs to console)
            const emailResult = await sendReminderEmail({
                to: appointment.patient.email,
                patientName,
                appointmentType: appointment.type,
                startTime: appointment.startTime,
            });

            // Only mark as sent if the email actually succeeded
            // This way if it fails, the next run can try again
            if (emailResult.success) {
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: {
                        reminderSent: true,       // prevents sending again
                        reminderSentAt: new Date(), // records when it was sent
                    },
                });

                // Track which reminders were sent for the response
                results.push({
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    email: appointment.patient.email,
                    sent: true,
                });
            }
        }

        // Return a summary of how many reminders were sent
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