import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{id: string}>}
) {
    try {
        const {id} = await context.params;
        const patientId = Number(id);

        if (!Number.isInteger(patientId) || patientId <= 0) {
            return badRequest("Invalid patient ID", {id});
        }

        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            select: {id: true},
        });

        if (!patient) {
            return notFound("Patient not found");
        }

        const payments = await prisma.payment.findMany({
            where: { appointment: { 
                patientId: patientId ,
                } },
            include: {
                appointment: {
                    include: {
                        provider: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return ok(payments);
    } catch (err) {
        console.error(err);
        return serverError("Failed to fetch payments");
    }
}