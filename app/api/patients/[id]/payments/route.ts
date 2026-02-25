import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { NextRequest } from "next/server";

// GET /api/patients/[id]/payments
//Returns all payments for a specific patient
export async function GET(
    req: NextRequest,
    context: { params: Promise<{id: string}>}
) {
    try {
        const {id} = await context.params;
        const patientId = Number(id);

        //makes sure ID is a positive.
        if (!Number.isInteger(patientId) || patientId <= 0) {
            return badRequest("Invalid patient ID", {id});
        }

        //checks if patient exists before fetching their payments.
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            select: {id: true},
        });

        if (!patient) {
            return notFound("Patient not found");
        }
        //finds all payments where the linked appointment belongs to the patient.
        const payments = await prisma.payment.findMany({
            where: { appointment: { 
                patientId: patientId ,
                } },
            include: {
                appointment: {
                    include: {
                        provider: true,
                        //provider info is needed to display the provider name in the payment history.
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            //newest payments first
        });

        return ok(payments);
    } catch (err) {
        console.error(err);
        return serverError("Failed to fetch payments");
    }
}