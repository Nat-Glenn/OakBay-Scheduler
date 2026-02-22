import { prisma } from "@/lib/prisma";

export async function findProviderOverlap(opts: {
  providerId: number;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: number;
}) {
  const { providerId, startTime, endTime, excludeAppointmentId } = opts;

  return prisma.appointment.findFirst({
    where: {
      providerId,
      ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
    select: { id: true, startTime: true, endTime: true },
  });

}

//patient overlap check
export async function findPatientOverlap(opts: {
  patientId: number;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: number;
}) {
  const { patientId, startTime, endTime, excludeAppointmentId } = opts;

  return prisma.appointment.findFirst({
    where: {
      patientId,
      ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
    select: { id: true, startTime: true, endTime: true },
  });
}