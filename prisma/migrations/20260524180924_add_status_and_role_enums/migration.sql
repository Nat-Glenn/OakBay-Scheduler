-- CreateEnum
CREATE TYPE "ClinicRole" AS ENUM ('Chiropractor', 'Receptionist');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED');

-- Normalize existing string values before casting
UPDATE "User"
SET "role" = 'Chiropractor'
WHERE LOWER(TRIM("role")) IN ('chiropractor', 'provider');

UPDATE "User"
SET "role" = 'Receptionist'
WHERE LOWER(TRIM("role")) = 'receptionist';

UPDATE "User"
SET "role" = 'Receptionist'
WHERE "role" NOT IN ('Chiropractor', 'Receptionist');

UPDATE "Appointment"
SET "status" = UPPER(TRIM("status"));

UPDATE "Appointment"
SET "status" = 'CANCELLED'
WHERE "status" NOT IN ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "ClinicRole" USING ("role"::"ClinicRole");

ALTER TABLE "Appointment"
ALTER COLUMN "status" TYPE "AppointmentStatus" USING ("status"::"AppointmentStatus");
