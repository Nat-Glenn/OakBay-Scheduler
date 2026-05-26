/**
 * Shared appointment reminder job: finds upcoming appointments and sends emails.
 */

import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { SCHEDULABLE_APPOINTMENT_STATUSES } from "@/lib/appointments/constants";

const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SendRemindersResult = {
  message: string;
  remindersFound: number;
  sentCount: number;
  results: Array<{
    appointmentId: number;
    patientId: number;
    email: string;
    sent: boolean;
  }>;
};

export async function sendUpcomingAppointmentReminders(
  windowMs: number = DEFAULT_WINDOW_MS,
): Promise<SendRemindersResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: now, lte: windowEnd },
      status: { in: [...SCHEDULABLE_APPOINTMENT_STATUSES] },
      reminderSent: false,
      patient: {
        reminderOptIn: true,
        email: { not: null },
      },
    },
    include: { patient: true, provider: true },
    orderBy: { startTime: "asc" },
  });

  const results: SendRemindersResult["results"] = [];

  for (const appointment of appointments) {
    if (!appointment.patient.email) continue;

    const emailResult = await sendReminderEmail({
      to: appointment.patient.email,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
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

  return {
    message: "Reminder job completed",
    remindersFound: appointments.length,
    sentCount: results.length,
    results,
  };
}
