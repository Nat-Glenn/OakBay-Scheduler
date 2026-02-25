import { prisma } from "@/lib/prisma";
import { parseIntStrict, parseNonEmptyString } from "@/lib/validate";
import { ok, created, badRequest, notFound, conflict, serverError } from "@/lib/api";


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const appointmentIdStr = searchParams.get("appointmentId");

        const where = appointmentIdStr ? { appointmentId: Number(appointmentIdStr) } : {};

        const payments = await prisma.payment.findMany({
            where,
            include: {
                appointment: {
                    include: {
                        patient: true,
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

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const appointmentId = Number(body.appointmentId);
        const paymentType = parseNonEmptyString(body.paymentType);
        const amount = Number(body.amount);

        if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
            return badRequest("Missing or invalid appointmentId");
        }
        if (!paymentType) {
            return badRequest("Missing or invalid paymentType", {
                accepted: ["cash", "credit_card", "insurance"],
            });
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            return badRequest("amount is required and must be a positive number");
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {payment: true },
        });

        if (!appointment) {
            return notFound("Appointment not found");
        }

        if (appointment.payment) {
            return conflict("Payment already exists for this appointment");
        }

        const [payment] = await prisma.$transaction([
            prisma.payment.create({
                data: {
                    appointmentId,
                    receiptSent: false,
                    paymentType,
                    amount,
                },
                include: {
                    appointment: {
                        include: {
                            patient: true,
                            provider: true,
                        },
                    },
                },
            }),

            prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: "COMPLETED" },
            }),
        ]);

        return created(payment);
    } catch (err) {
        console.error(err);
        return serverError("Failed to record payment");
    }
}