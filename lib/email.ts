import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderAddress = process.env.AZURE_EMAIL_SENDER_ADDRESS;
const CLINIC_NAME = "Oak Bay Family Chiropractic";

function formatAppointmentTime(startTime: Date) {
  return new Date(startTime).toLocaleString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!connectionString || !senderAddress) {
    console.log("Azure email is not configured.");
    console.log({ to, subject, text });
    return { success: true };
  }

  try {
    const client = new EmailClient(connectionString);

    const poller = await client.beginSend({
      senderAddress,
      recipients: {
        to: [{ address: to }],
      },
      content: {
        subject,
        plainText: text,
        html,
      },
    });

    const result = await poller.pollUntilDone();

    if (result.status === "Succeeded") {
      return { success: true };
    }

    console.error("Azure email send failed:", result);
    return { success: false };
  } catch (error) {
    console.error("Failed to send Azure email:", error);
    return { success: false };
  }
}

export async function sendBookingConfirmationEmail({
  to,
  patientName,
  appointmentType,
  startTime,
}: {
  to: string;
  patientName: string;
  appointmentType: string;
  startTime: Date;
}) {
  const formattedTime = formatAppointmentTime(startTime);

  return sendEmail({
    to,
    subject: `Appointment Confirmed — ${formattedTime}`,
    text: `Hello ${patientName},

Your ${appointmentType} appointment has been booked successfully.

Date and time: ${formattedTime}

Thank you,
${CLINIC_NAME}`,
    html: `
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>Your <strong>${appointmentType}</strong> appointment has been booked successfully.</p>
      <p><strong>Date and time:</strong> ${formattedTime}</p>
      <br/>
      <p>Thank you,<br/>${CLINIC_NAME}</p>
    `,
  });
}

export async function sendCancellationEmail({
  to,
  patientName,
  appointmentType,
  startTime,
}: {
  to: string;
  patientName: string;
  appointmentType: string;
  startTime: Date;
}) {
  const formattedTime = formatAppointmentTime(startTime);

  return sendEmail({
    to,
    subject: `Appointment Cancelled — ${formattedTime}`,
    text: `Hello ${patientName},

Your ${appointmentType} appointment scheduled for ${formattedTime} has been cancelled.

Please contact the clinic if you would like to rebook.

Thank you,
${CLINIC_NAME}`,
    html: `
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>Your <strong>${appointmentType}</strong> appointment scheduled for <strong>${formattedTime}</strong> has been cancelled.</p>
      <p>Please contact the clinic if you would like to rebook.</p>
      <br/>
      <p>Thank you,<br/>${CLINIC_NAME}</p>
    `,
  });
}

export async function sendReminderEmail({
  to,
  patientName,
  appointmentType,
  startTime,
}: {
  to: string;
  patientName: string;
  appointmentType: string;
  startTime: Date;
}) {
  const formattedTime = formatAppointmentTime(startTime);

  return sendEmail({
    to,
    subject: `Appointment Reminder — ${formattedTime}`,
    text: `Hello ${patientName},

This is a reminder that you have a ${appointmentType} appointment scheduled for ${formattedTime}.

Please contact the clinic if you need to make any changes.

Thank you,
${CLINIC_NAME}`,
    html: `
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>This is a reminder that you have a <strong>${appointmentType}</strong> appointment scheduled for <strong>${formattedTime}</strong>.</p>
      <p>Please contact the clinic if you need to make any changes.</p>
      <br/>
      <p>Thank you,<br/>${CLINIC_NAME}</p>
    `,
  });
}