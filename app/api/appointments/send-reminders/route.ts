import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function POST() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lte: oneHourFromNow,
        },
        createdAt: {
          lte: oneHourAgo,
        },
        reminderSent: false,
        status: {
          in: ["REQUESTED", "CONFIRMED"],
        },
        patient: {
          email: {
            not: null,
          },
        },
      },
      include: {
        patient: true,
      },
    });

    let remindersSent = 0;

    for (const appointment of appointments) {
      if (!appointment.patient?.email) continue;

      const result = await sendReminderEmail({
        to: appointment.patient.email,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        appointmentType: appointment.type,
        startTime: appointment.startTime,
      });

      if (result.success) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            reminderSent: true,
            reminderSentAt: new Date(),
          },
        });

        remindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      remindersFound: appointments.length,
      remindersSent,
    });
  } catch (error) {
    console.error("Failed to send reminders:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send reminders",
      },
      { status: 500 }
    );
  }
}