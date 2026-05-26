-- CreateTable
CREATE TABLE "ProviderShift" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "shiftDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "updatedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderShift_providerId_shiftDate_idx" ON "ProviderShift"("providerId", "shiftDate");

-- CreateIndex
CREATE INDEX "ProviderShift_shiftDate_idx" ON "ProviderShift"("shiftDate");

-- CreateIndex
CREATE INDEX "ProviderShift_startTime_endTime_idx" ON "ProviderShift"("startTime", "endTime");

-- AddForeignKey
ALTER TABLE "ProviderShift" ADD CONSTRAINT "ProviderShift_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderShift" ADD CONSTRAINT "ProviderShift_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
