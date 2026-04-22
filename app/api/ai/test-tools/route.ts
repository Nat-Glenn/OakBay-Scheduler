import {
  getOverdueAppointments,
  getPatientSummary,
  getPractitionerDailySummary,
  getDailyOperationsReportData,
} from "@/lib/ai/tools";

export async function GET() {
  try {
    const overdue = await getOverdueAppointments();
    const daily = await getDailyOperationsReportData();
    const practitioner = await getPractitionerDailySummary();
    const patient = await getPatientSummary("Chad");

    return Response.json({
      overdue,
      daily,
      practitioner,
      patient,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to test tools" }, { status: 500 });
  }
}