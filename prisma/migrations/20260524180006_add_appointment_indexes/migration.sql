-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateIndex
CREATE INDEX "Appointment_providerId_startTime_idx" ON "Appointment"("providerId", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_status_reminderSent_idx" ON "Appointment"("status", "reminderSent");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
