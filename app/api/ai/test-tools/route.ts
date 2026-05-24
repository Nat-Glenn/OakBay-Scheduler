import {
  getOverdueAppointments,
  getPatientSummary,
  getPractitionerDailySummary,
  getDailyOperationsReportData,
} from "@/lib/ai/tools";
import { withAuthSimple } from "@/lib/withAuth";

export const GET = withAuthSimple(async () => {
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
});