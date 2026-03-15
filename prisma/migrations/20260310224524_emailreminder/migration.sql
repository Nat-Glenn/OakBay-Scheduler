-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
