import { Resend } from "resend";

// FROM address — must be a verified domain in Resend
// During development use onboarding@resend.dev (Resend's test address)
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const CLINIC_NAME = "Oak Bay Family Chiropractic";

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
    // If no API key is set, log and return success to avoid breaking the app
    if (!process.env.RESEND_API_KEY) {
        console.log("Sending email reminder...");
        console.log("To: ", to);
        console.log("Subject: ", "Appointment Reminder");
        console.log("Message: ", `Hello ${patientName}, your ${appointmentType} appointment is on ${startTime.toLocaleString()}`);
        return { success: true };
    }

    // Only create Resend client if API key exists — prevents crash on missing key
    const resend = new Resend(process.env.RESEND_API_KEY);

    const formattedTime = startTime.toLocaleString("en-CA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    try {
        const { error } = await resend.emails.send({
            from: `${CLINIC_NAME} <${FROM_ADDRESS}>`,
            to,
            subject: `Appointment Reminder — ${formattedTime}`,
            text: `Hello ${patientName},\n\nThis is a reminder for your upcoming ${appointmentType} appointment scheduled on ${formattedTime}.\n\nPlease let us know if you have any questions or need to reschedule.\n\nBest regards,\n${CLINIC_NAME}`,
            html: `
                <p>Hello <strong>${patientName}</strong>,</p>
                <p>This is a reminder for your upcoming <strong>${appointmentType}</strong> appointment scheduled on:</p>
                <p><strong>${formattedTime}</strong></p>
                <p>Please let us know if you have any questions or need to reschedule.</p>
                <br/>
                <p>Best regards,<br/>${CLINIC_NAME}</p>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false };
        }

        return { success: true };
    } catch (err) {
        console.error("Failed to send email:", err);
        return { success: false };
    }
}