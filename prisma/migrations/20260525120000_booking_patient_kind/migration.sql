-- CreateEnum
CREATE TYPE "BookingPatientKind" AS ENUM ('NEW', 'RETURNING');

-- AlterTable
ALTER TABLE "AppointmentRequest" ADD COLUMN "patientKind" "BookingPatientKind" NOT NULL DEFAULT 'NEW';
