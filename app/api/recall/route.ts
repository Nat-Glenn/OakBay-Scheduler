import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api";

export async function GET() {
    try {
        // Get today's date and calculate what date was 6 months ago
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Fetch all patients and include all their appointments
        // orderBy desc = newest appointment first (important for [0] later)
        const patients = await prisma.patient.findMany({
            include: {
                appointments: {
                    include: {
                        provider: true,
                        payment: true,
                    },
                    orderBy: {
                        startTime: "desc", // newest first so [0] = most recent
                    },
                },
            },
            orderBy: {
                lastName: "asc", // alphabetical list
            },
        });

        const recallList = patients
            .map((patient) => {
                const appointments = patient.appointments;

                // Future appointments that aren't cancelled
                // If this list has anything, patient already has something booked
                const futureAppointments = appointments.filter(
                    (a) => a.startTime > today && a.status !== "CANCELLED"
                );

                // Only keep completed appointments
                const completedAppointments = appointments.filter(
                    (a) => a.status === "COMPLETED"
                );

                // [0] = most recent completed appointment (because we sorted desc above)
                // ?? null = if no completed appointments, use null
                const lastCompleted = completedAppointments[0] ?? null;

                // Patient needs to be recalled only if ALL 3 are true:
                // 1. They have at least one completed appointment
                // 2. That appointment was more than 6 months ago
                // 3. They have nothing currently booked
                const shouldRecall =
                    !!lastCompleted &&
                    lastCompleted.startTime < sixMonthsAgo &&
                    futureAppointments.length === 0;

                // Skip this patient if they don't meet recall conditions
                if (!shouldRecall) return null;

                // Return the patient info we need for the recall list
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
            // Remove all the nulls — only keep patients who should be recalled
            .filter(Boolean);

        return ok(recallList);
    } catch (err) {
        console.error(err);
        return serverError("Failed to load recall list");
    }
}