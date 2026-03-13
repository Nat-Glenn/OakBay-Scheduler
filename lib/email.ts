
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
    const subject = "Appointment Reminder";
    const message = ` Hello ${patientName},\n\nThis is a reminder for your upcoming ${appointmentType} appointment scheduled on ${startTime.toLocaleString()}.
    \n\nPlease let us know if you have any questions or need to reschedule.\n\nBest regards,\nOakBay Clinic`.trim();

    console.log("Sending email reminder...");
    console.log("To: ", to);
    console.log("Subject: ", subject);
    console.log("Message: ", message);

    return {success:true};
}